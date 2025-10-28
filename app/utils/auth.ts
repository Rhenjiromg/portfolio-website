import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

interface loginProps {
  credentials: string;
  password: string;
}
async function Login({ credentials, password }: loginProps) {
  const email = credentials + "@emailingme.com";
  const res = await signInWithEmailAndPassword(auth, email, password);
  if (res) {
    const token = await res.user.getIdToken();
    localStorage.setItem("token", token);
    return res.user;
  }
}

export { Login };
