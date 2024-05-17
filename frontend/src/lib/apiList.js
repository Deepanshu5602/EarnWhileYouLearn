export const server = "http://localhost:4444";

const apiList = {
  verify: `${server}/auth/verify`,
  login: `${server}/auth/login`,
  signup: `${server}/auth/signup`,
  uploadResume: `${server}/up/resume`,
  uploadMOM: `${server}/up/MOM`,
  uploadProfileImage: `${server}/up/profile`,
  jobs: `${server}/api/jobs`,
  applications: `${server}/api/applications`,
  rating: `${server}/api/rating`,
  user: `${server}/api/user`,
  applicants: `${server}/api/applicants`,
};

export default apiList;
