import { createContext, useState, useEffect } from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { Grid, makeStyles, createTheme, ThemeProvider } from "@material-ui/core";

import Welcome, { ErrorPage } from "./component/Welcome";
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";
import Login from "./component/Login";
import Logout from "./component/Logout";
import Signup from "./component/Signup";
import Home from "./component/Home";
import Applications from "./component/Applications";
import Profile from "./component/Profile";
import CreateJobs from "./component/recruiter/CreateJobs";
import MyJobs from "./component/recruiter/MyJobs";
import JobApplications from "./component/recruiter/JobApplications";
import AcceptedApplicants from "./component/recruiter/AcceptedApplicants";
import RecruiterProfile from "./component/recruiter/Profile";
import MessagePopup from "./lib/MessagePopup";
import isAuth, { userType } from "./lib/isAuth";
import VerifyEmailWrapper from "./lib/VerifyEmailWrapper";
import apiList from "./lib/apiList";
import Verify from "./lib/verification";

const customTheme = createTheme({
  palette: {
    primary: {
      main: "#003F88", // Change to your primary color
    },
    secondary: {
      main: "#007FC8", // Change to your secondary color
    },
  },
});
const useStyles = makeStyles((theme) => ({
  body: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "98vh",
    paddingTop: "64px",
    boxSizing: "border-box",
    width: "100%",
  },
}));

export const SetPopupContext = createContext();

function App() {
  const [loggedin, setLoggedin] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const fetchEmailVerificationStatus = async () => {
      const response = await fetch(apiList.getEmailVerificationStatus);
      const data = await response.json();
      setLoggedin(data.loggedin);
      setEmailVerified(data.emailVerified);
    };
    fetchEmailVerificationStatus();
  }, []);

  const classes = useStyles();
  const [popup, setPopup] = useState({
    open: false,
    severity: "",
    message: "",
  });
  return (
    
    <BrowserRouter>
    <ThemeProvider theme={customTheme}>
      <SetPopupContext.Provider value={setPopup}>
        <Grid container direction="column">
          <Grid item xs>
            <Navbar />
          </Grid>
          <Grid item className={classes.body}>
            <Switch>
              <Route exact path="/">
                <VerifyEmailWrapper>
                <Welcome />
                </VerifyEmailWrapper>
              </Route>
              <Route exact path="/login">
                <Login />
              </Route>
              
              <Route exact path="/signup">
                <Signup />
              </Route>
              <Route exact path="/verify">
                <Verify />
              </Route>
                <Route exact path="/logout">
                  <Logout />
                </Route>
              <Route exact path="/home">
                <VerifyEmailWrapper>
                <Home />
                </VerifyEmailWrapper>
              </Route>
  
              
              <Route exact path="/applications">
                <VerifyEmailWrapper>
                <Applications />
                </VerifyEmailWrapper>
              </Route>
  
              
              <Route exact path="/profile">
                <VerifyEmailWrapper> 
                {userType() === "recruiter" ? (
                  <RecruiterProfile />
                ) : (
                  <Profile />
                )}
                </VerifyEmailWrapper>
              </Route>
  
              <Route exact path="/addjob">
                <VerifyEmailWrapper>
                <CreateJobs />
                </VerifyEmailWrapper>
              </Route>
              <Route exact path="/myjobs">
                <VerifyEmailWrapper>
                <MyJobs />
                </VerifyEmailWrapper>
              </Route>
              <Route exact path="/job/applications/:jobId">
                <VerifyEmailWrapper>
                <JobApplications />
                </VerifyEmailWrapper>
              </Route>
              <Route exact path="/employees">
                <VerifyEmailWrapper>
                <AcceptedApplicants />
                </VerifyEmailWrapper>
              </Route>
              <Route>
                <ErrorPage />
              </Route>
  
            </Switch>
          </Grid>
          <Grid item xs>
            <Footer />
          </Grid>
        </Grid>
        <MessagePopup
          open={popup.open}
          setOpen={(status) =>
            setPopup({
              ...popup,
              open: status,
            })
          }
          severity={popup.severity}
          message={popup.message}
        />
      </SetPopupContext.Provider>
    </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
