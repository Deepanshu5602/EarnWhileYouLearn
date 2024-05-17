import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles((theme) => ({
  footer: {
    top: "auto",
    bottom: 0,
    display: "flex",
    justifyContent: "space-between", // Align elements to the right
  },
  title: {
    flexGrow: 1, // Allows the copyright text to take up available space
    textAlign: "left", // Align the text to the left
  },
  link: {
    textAlign: "right", // Align the link to the right
  },
}));

const Footer = () => {
  const classes = useStyles();

  return (
    <AppBar position="bottom" className={classes.footer}>
      <Toolbar>
        <Typography variant="p" className={classes.title}>
          &copy; {new Date().getFullYear()} EWYL, IIT Jammu
        </Typography>
        <Typography variant="h6" className={classes.link}>
          <a href="" target="_blank" rel="noopener noreferrer"color="while">
            Credits
          </a>
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Footer;
