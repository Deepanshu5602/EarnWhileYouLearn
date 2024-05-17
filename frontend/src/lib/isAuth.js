const isAuth = () => {
  // console.log("i am isAuth", localStorage.getItem("token"));
  return localStorage.getItem("token");
};

export const userType = () => {
  return localStorage.getItem("type");
};

export default isAuth;
