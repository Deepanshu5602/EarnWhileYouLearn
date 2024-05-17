import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Redirect } from "react-router-dom";
import isAuth from "../lib/isAuth";
import axios from "axios";
import apiList from "../lib/apiList";


function Verify() {
    const history = useHistory();
    const location = useLocation();
    const id = new URLSearchParams(location.search).get("id");
  
    useEffect(() => {
      const verifyEmail = async () => {
        try {
          // Make a GET request with the id as a query parameter
          await fetch(`${apiList.verify}?id=${id}`);
          // Redirect to the login page after the request is successful
          history.push("/login");
        } catch (error) {
          // Handle any errors here
          console.error("Error verifying email:", error);
        }
      };
  
      verifyEmail();
    }, [id, history]);
    
    return (
      // You can render some loading content here while the request is being made
    //   <div>Loading...</div>
     <Redirect to="/login" />
    );
  }

export default Verify;