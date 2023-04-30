import axios from 'axios'; 
import { showAlert } from './alerts';

export const login =async (email,password)=>{
    try{
        const resp =await  axios({
              method:'POST',
              url:'http://127.0.0.1:5000/api/v1/users/login',
              data:{
                  email,
                  password
              }
          });
        if(resp.data.status ==='success'){
            showAlert('success','Logged in successfully');
            window.setTimeout(()=>{
                location.assign('/');
            },1500);
        }
        
    }catch(err){
        showAlert('error',err.response.data.message);
    }
}

export const logout = async()=>{
    try{
        const resp =await  axios({
            method:'GET',
            url:'http://127.0.0.1:5000/api/v1/users/logout',
        });
      if(resp.data.status ==='success') location.reload(true);
    }catch(resp){
        showAlert('error','Error in logging out! Try again.');
    }
}
