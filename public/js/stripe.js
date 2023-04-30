import axios from "axios";
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51Mz97pHwBxbRLo2fh1uLIE5r5JEayB5Sek8ZLntm6NMCcEzGC8kNSgWEBw1RjH9hR0AdtBO2SOfmZGfd3dMD2JXI0059WvflQv');

export const bookTour = async tourId => {
 try { 
  //1) Get checkout session from API
  const session = await axios(
    `http://127.0.0.1:5000/api/v1/bookings/checkout-session/${tourId}`
    );
  //2) create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    })
 }catch(err){
  showAlert('error',err);
 }
}