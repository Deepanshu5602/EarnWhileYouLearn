import React, { useEffect, useState } from "react";
import { Redirect } from "react-router-dom";
import axios from "axios";
import apiList from "../lib/apiList";
import isAuth from "../lib/isAuth";

const VerifyEmailWrapper = ({ children }) => {
  const [emailVerified, setEmailVerified] = useState(isAuth());

  if (!emailVerified) {
    return <Redirect to="/login" />;
  }

    // return !loggedin?(
        
    // )

  return <>{children}</>;
};

export default VerifyEmailWrapper;
