const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(user,url){
        this.to = user.email,
        this.firstName = user.name.split(' ')[0],
        this.url = url,
        this.from = `MD Khalid <${process.env.EMAIL_FROM}>`
    }

    newTransport(){
        if(process.env.NODE_ENV === 'production'){
            //sendgrid
            return nodemailer.createTransport({
                service:'SendGrid',
                auth:{
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }
            });
        }
        
       return nodemailer.createTransport({
            host:process.env.EMAIL_HOST,
            port:process.env.EMAIL_PORT,
            auth:{
                user:process.env.EMAIL_USER,
                pass:process.env.EMAIL_PASSWORD
            }
        });
    }
    //send the actual email
   async send(template,subject){
        // 1)Render HTML base a pug template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`,{
            firstName: this.firstName,
            url: this.url,
            subject
        });
        // 2)Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.convert(html)
        }
        // 3)create a transport and send 
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome(){
       await this.send('welcome','welcome to Natours!');
    }

    async sendPasswordReset(){
        await this.send('passwordReset','Your password reset token (valid for 1 Hour)');
     }
}

