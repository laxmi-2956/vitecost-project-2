import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/login.css";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { signupError, signupStart, signupSuccess } from "../redux/auth/authSlice";




const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const data = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  console.log(data);

  const handleSignup = async () => {
    dispatch(signupStart());

    if (!name || !email || !password) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await axios.post(
        "https://vitecost-project-2.onrender.com/api/user/signup",
        { name, email, password },
        { withCredentials: true }
      );

      console.log("Signup Response:", response.data);
      sessionStorage.setItem("verify_email", email);

      if (response.status === 200) {
        dispatch(signupSuccess());
        alert("OTP sent! Redirecting to verification page...");
        setTimeout(() => navigate("/verify"), 1000);
      } else {
        dispatch(signupError(response.data.message || "Signup failed"));
        alert(response.data.message || "Signup failed");
      }
    } catch (error) {
      dispatch(signupError(error?.response?.data?.message || "Something went wrong"));
      alert(error?.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <h2>Create your account</h2>

        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Email address:</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn" onClick={handleSignup}>Sign Up</button>

        <p className="forgot-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>

      <div className="benefits">
        <h3>Why create an account?</h3>
        <ul>
          <li>Faster checkout process</li>
          <li>Access to exclusive deals</li>
          <li>Track and manage orders</li>
          <li>Save addresses & payment methods</li>
          <li>Get personalized offers</li>
        </ul>

        <p>
          Not ready to register? Continue as a <a href="/" className="guest-link">Guest</a>.
        </p>
      </div>
    </div>
  );
};

export default Signup;
