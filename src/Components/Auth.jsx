import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import "./Auth.css";

function Auth() {
  
  // Login Function
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
      console.log("User logged in:", auth.currentUser);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };



  return (
    <div className="auth-container">
      <button onClick={loginWithGoogle} className="auth-button">
      Login with Google
    </button>
    </div>
  );
}

export default Auth;
