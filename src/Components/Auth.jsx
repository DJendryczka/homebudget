import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

function Auth() {
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
      console.log("User logged in:", auth.currentUser);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <button onClick={loginWithGoogle} className="btn btn-primary">
      Login with Google
    </button>
  );
}

export default Auth;
