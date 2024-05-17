import express from "express";
import mongoose from "mongoose";
import jwtAuth from "../lib/jwtAuth.js"

import User from '../db/User.js'; 
import JobApplicant from '../db/JobApplicant.js';
import Recruiter from '../db/Recruiter.js';
import Job from '../db/Job.js';
import Application from '../db/Application.js';
import Rating from '../db/Rating.js';

const router = express.Router();

router.post("/jobs", jwtAuth, async (req, res)=>{
    const user = req.user;

    if(user.type != "recruiter"){
        return res.status(401).json({
            message: "You don't have permissions to add jobs",
          });
    }

    const data = req.body;
    const job = new Job({
        userId: user._id,
        ...data
    });
    try {
        await job.save();
        res.json({ message: "Job added successfully to the database" });
    } catch (err) {
        res.status(400).json(err);
    }
});



router.get("/jobs", jwtAuth, async (req, res)=>{
  const user = req.user;
  let findParams = {};
  let sortParams = {};

  if(user.type === "recruiter" && req.query.myjobs){
      findParams = {
          ...findParams,
          userId: user._id,
      };
  }
  console.log(req.query)
  if (req.query.q) {
    const query = req.query.q;
    const searchArray = query.split(',').map(item => item.trim());

    const titleConditions = searchArray.map(item => ({
      title: {
        $regex: new RegExp(item, "i"),
      },
    }));

    const skillsetsConditions = searchArray.map(item => ({
      skillsets: {
        $regex: new RegExp(item, "i"),
      },
    }));

    const orConditions = [
      ...titleConditions,
      ...skillsetsConditions,
    ];

    findParams = {
      ...findParams,
      $or: orConditions,
    };
  }

  

  if (req.query.jobType) {
      let jobTypes = Array.isArray(req.query.jobType) ? req.query.jobType : [req.query.jobType];
      findParams = {
        ...findParams,
        jobType: {
          $in: jobTypes,
        },
      };
    }
  
  
    if (req.query.salaryMin && req.query.salaryMax) {
        findParams = {
            ...findParams,
            $and: [
            {
                salary: {
                $gte: parseInt(req.query.salaryMin),
                },
            },
            {
                salary: {
                $lte: parseInt(req.query.salaryMax),
                },
            },
            ],
    };
    } else if (req.query.salaryMin) {
        findParams = {
            ...findParams,
            salary: {
            $gte: parseInt(req.query.salaryMin),
            },
    };
    } else if (req.query.salaryMax) {
        findParams = {
            ...findParams,
            salary: {
            $lte: parseInt(req.query.salaryMax),
            },
        };
    }
    if (req.query.duration) {
        findParams = {
            ...findParams,
            duration: {
            $lt: parseInt(req.query.duration),
            },
        };
    }

    if (req.query.asc) {
        if (Array.isArray(req.query.asc)) {
          req.query.asc.forEach((key) => {
            sortParams = {
              ...sortParams,
              [key]: 1,
            };
          });
        } else {
          sortParams = {
            ...sortParams,
            [req.query.asc]: 1,
          };
        }
      }
    
    if(req.query.desc){
        if(Array.isArray(req.query.desc)){
            req.query.desc.forEach((key)=>{
                sortParams = {
                    ...sortParams,
                    [key]: -1,
                };
            });
        }else{
            sortParams = {
                ...sortParams,
                [req.query.desc]: -1,
            };
        }
    }
    let aggregationPipeline = [
        {
          $lookup: {
            from: "recruiterinfos",
            localField: "userId",
            foreignField: "userId",
            as: "recruiter",
          },
        },
        { $unwind: "$recruiter" },
        { $match: findParams },
      ];
    
    if (Object.keys(sortParams).length > 0) {
        aggregationPipeline.push({
          $sort: sortParams,
        });
    }
    try {
        const posts = await Job.aggregate(aggregationPipeline);
        //console.log("length" + posts.length);
        // if (posts.length === 0) {
        //   return res.status(404).json({
        //     message: "No job found",
        //   });
        // }
        res.json(posts);
    } catch (err) {
        console.log("error encountered");
        console.log(err);
        res.status(400).json(err);
    }     
});
router.get("/jobs/:id", jwtAuth, async (req, res) => {
    try {
      const job = await Job.findOne({ _id: req.params.id }).exec();
  
      if (!job) {
        return res.status(404).json({
          message: "Job does not exist",
        });
      }
  
      res.json(job);
    } catch (err) {
      res.status(400).json(err);
    }
  });

router.put("/jobs/:id", jwtAuth, async (req, res) => {

    const user = req.user;
    // console.log(req.user);
    if(user.type !== "recruiter"){
        return res.status(401).json({
            message: "You don't have permissions to update jobs",
        });
    }
    try{
        const job = await Job.findOne({_id: req.params.id, userId: user.id}).exec();
        if(!job){
            return res.status(404).json({
                message: "Job does not exist",
            });
        }
        const data = req.body;
        // console.log(data);
        if(data.salary){
            job.salary = data.salary;
        }
        if(data.duration){
            job.duration = data.duration;
        }
        if(data.maxApplicants){
            // console.log(data.maxApplicants);
            job.maxApplicants = data.maxApplicants;
        }

        if(data.maxPositions){
            job.maxPositions = data.maxPositions;
        }
        if(data.deadline){
            job.deadline = data.deadline;
        }
        // console.log(typeof job);
        await job.save();
        // console.log("done");
        res.json({
            message: "Job updated successfully",
        });
    } catch (err){
        // console.log("error");
        // console.log(err);
        res.status(400).json(err);
    }
});
  
router.delete("/jobs/:id", jwtAuth, async(req, res)=>{
    const user = req.user;
    if(user.type !== "recruiter"){
        return res.status(401).json({
            message: "You don't have permissions to delete jobs",
        });
    }
    try{
      const jobToDel = await Job.findOne({_id: req.params.id, userId: user.id}).exec();
      if(jobToDel.acceptedCandidates > 0){
        return res.status(401).json({
          message: "You cannot delete a job with accepted candidates",
        });
      }
    }catch(err){
      res.status(400).json({err});
    }
    try{
        const job = await Job.findOneAndDelete({_id: req.params.id, userId: user.id});
        if(!job){
            return res.status(401).json({
                message: "Inavlid JobID",
            });
        }
        res.json({
            message: "Job deleted successfully",
        });
    }catch(err){
        res.status(400).json({err});
    }
});
router.get("/user", jwtAuth, async (req, res) => {
    const user = req.user;
    // console.log(user);
    try {
      if (user.type === "recruiter") {
        const recruiter = await Recruiter.findOne({ userId: user._id });
        // console.log(recruiter);
        if (recruiter === null) {
          return res.status(404).json({
            message: "User does not exist",
          });
        }
  
        res.json(recruiter);
      } else {
        const jobApplicant = await JobApplicant.findOne({ userId: user._id });
  
        if (jobApplicant === null) {
          return res.status(404).json({
            message: "User does not exist",
          });
        }
  
        res.json(jobApplicant);
      }
    } catch (err) {
      res.status(400).json(err);
    }
  });
router.get("/user/:id", jwtAuth, async (req, res) => {
    try {
      const userData = await User.findOne({ _id: req.params.id }).exec();
      // console.log(userData);
      if (userData === null) {
        return res.status(404).json({
          message: "User does not exist",
        });
      }
      
      if (userData.type === "recruiter") {

        const recruiter = await Recruiter.findOne({ userId: userData._id }).exec();
        // console.log(recruiter);
        if (recruiter === null) {
          return res.status(404).json({
            message: "User does not exist",
          });
        }
  
        res.json(recruiter);
      } else {
        const jobApplicant = await JobApplicant.findOne({ userId: userData._id }).exec();
  
        if (jobApplicant === null) {
          return res.status(404).json({
            message: "User does not exist",
          });
        }
  
        res.json(jobApplicant);
      }
    } catch (err) {
      res.status(400).json(err);
    }
  });
  
router.put("/user", jwtAuth, async (req, res) => {
    
    const user = req.user;
    const data = req.body;
    console.log(user)
    console.log(data)
  
    try {
      if (user.type === "recruiter") {
        
        const recruiter = await Recruiter.findOne({ userId: user._id }).exec();
  
        if (recruiter === null) {
            // console.log("updating recruiter");

          return res.status(404).json({
            message: "User does not exist",
          });
        }
  
        // Update recruiter's information if provided
        if (data.name) {
          recruiter.name = data.name;
        }
        if (data.contactNumber) {
          recruiter.contactNumber = data.contactNumber;
        }
        if (data.bio) {
          recruiter.bio = data.bio;
        }
  
        // Save the updated recruiter's information
        await recruiter.save();
  
        res.json({
          message: "User information updated successfully",
        });
      } else {
        // Find the job applicant by user ID
        const jobApplicant = await JobApplicant.findOne({ userId: user._id }).exec();
  
        if (jobApplicant === null) {
          return res.status(404).json({
            message: "User does not exist",
          });
        }
  
        // Update job applicant's information if provided
        if (data.name) {
          jobApplicant.name = data.name;
        }
        if (data.education) {
          jobApplicant.education = data.education;
        }
        if (data.skills) {
          jobApplicant.skills = data.skills;
        }
        if (data.resume) {
          jobApplicant.resume = data.resume;
        }
        if (data.profile) {
          jobApplicant.profile = data.profile;
        }
  
        // Save the updated job applicant's information
        await jobApplicant.save();
  
        res.json({
          message: "User information updated successfully",
        });
      }
    } catch (err) {
      console.log(err);
      res.status(400).json(err);
    }
  });

router.post("/jobs/:id/applications", jwtAuth, async (req, res) => {
    const user = req.user;
    console.log(user);
    if(user.type !== "applicant"){
        return res.status(401).json({
            message: "You don't have permissions to apply for jobs",
        });
    }

    try{
      const data = req.body;
      const userId  = user._id;
      const jobId = req.params.id;
      console.log(req.body);
      const appliedApplication =  await Application.findOne({
        userId: user._id,
        jobId: jobId,
        status: {
          $nin: ["deleted", "accepted", "cancelled"],
        },
      }).exec();

      if(appliedApplication){
        return res.status(400).json({
          message: "You have already applied for this job",
        });
      }
      const job = await Job.findOne({_id: jobId}).exec();

      if(!job){
        return res.status(400).json({
          message: "Job does not exist",
        });
      }

      const activeApplicationCount = await Application.countDocuments({
        jobId: job._id, 
        status: { $nin: ["deleted", "accepted", "cancelled"] } 
      }).exec();
      
      if(activeApplicationCount < job.maxApplicants){

        const myActiveApplicationCount = await Application.countDocuments({
          userId: user._id,
          status: {
            $nin: ["rejected", "deleted", "cancelled", "finished"],
          },
        }).exec();

        if(myActiveApplicationCount < 5){
          const acceptedJobs = await Application.countDocuments({
            userId: user._id,
            status: "accepted",
          }).exec();

          if(acceptedJobs === 0){
            const application = new Application({
              userId: user._id,
              recruiterId: job.userId,
              jobId: job._id,
              status: "applied",
              sop: data.sop,
            });

            await application.save();

            return res.json({
              message: "Application sent successfully",
            });
          }else{
            return res.status(400).json({
              message: "You already have an accepted job",
            });
          }
        }else{
          return res.status(400).json({
            message: "You cannot have more than 10 active applications",
          });
        }
      }else{
        console.log(activeApplicationCount);
        console.log(job.maxApplicants);
        return res.status(400).json({
          message: "Application limit reached for this job",
        });
      }
    }catch(err){
      console.log("This is the error##############################")
      console.log(err);
      res.status(400).json(err);
    }
  });

// router.get("/jobs/:id/applications", jwtAuth, async (req, res) => {
//   console.log("yes its important################");
//   const user = req.user;
//   console.log(req);
//   if(user.type !== "recruiter"){
//     return res.status(401).json({
//       message: "You don't have permissions to view applications",
//     });
//   }
//   const jobId = req.params.id;

//   let findParams = {
//     jobId: jobId,
//     recruiterId: user._id,
//   };
//   let sortParams = {};

//   if (req.query.status) {
//     findParams.status = req.query.status;
//   }

//   try{
//     const applications = await Application.find(findParams).exec();
//     res.json(applications);
//   }catch(err){
//     res.status(400).json(err);
//   }
//   });

// this function gest the list of jobs for which a user had applied
router.get("/applications", jwtAuth, async (req, res) => {
  const user = req.user;
  console.log("it uses");
  console.log(req.body);
  try{
    const pipeline = [
      {
        $lookup: {
          from: "jobapplicantinfos",
          localField: "userId",
          foreignField: "userId",
          as: "jobApplicant",
        },
      },
      { $unwind: "$jobApplicant" },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: "$job" },
      {
        $lookup: {
          from: "recruiterinfos",
          localField: "recruiterId",
          foreignField: "userId",
          as: "recruiter",
        },
      },
      { $unwind: "$recruiter" },
      {
        $match: {
          [user.type === "recruiter" ? "recruiterId" : "userId"]: user._id,
        },
      },
      {
        $sort: {
          dateOfApplication: -1,
        },
      },
    ];
    const applications = await Application.aggregate(pipeline);
    res.json(applications);
  }catch(err){
    res.status(400).json(err)
  }
  });

// this function will get all the applicant's list for a job posted by a recruiter
router.get("/applicants", jwtAuth, async (req, res) => {
  const user = req.user;
  if(user.type !== "recruiter"){
    return res.status(401).json({
      message: "You don't have permissions to view applicants",
    });
  }
  try {
    let findParams = {
      recruiterId: user._id,
    };

    if (req.query.jobId) {
      findParams.jobId = new mongoose.Types.ObjectId(req.query.jobId);
    }

    if (req.query.status) {
      if (Array.isArray(req.query.status)) {
        findParams.status = { $in: req.query.status };
      } else {
        findParams.status = req.query.status;
      }
    }

    let sortParams = {};

    if (!req.query.asc && !req.query.desc) {
      sortParams = { _id: 1 };
    }

    if (req.query.asc) {
      if (Array.isArray(req.query.asc)) {
        req.query.asc.forEach((key) => {
          sortParams[key] = 1;
        });
      } else {
        sortParams[req.query.asc] = 1;
      }
    }

    if (req.query.desc) {
      if (Array.isArray(req.query.desc)) {
        req.query.desc.forEach((key) => {
          sortParams[key] = -1;
        });
      } else {
        sortParams[req.query.desc] = -1;
      }
    }
    console.log(findParams);
    console.log(sortParams);
    console.log(req.query);
    const pipeline = [
      {
        $lookup: {
          from: "jobapplicantinfos",
          localField: "userId",
          foreignField: "userId",
          as: "jobApplicant",
        },
      },
      { $unwind: "$jobApplicant" },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: "$job" },
      { $match: findParams },
      { $sort: sortParams },
    ];

    const applications = await Application.aggregate(pipeline);

    // if (applications.length === 0) {
    //   return res.status(404).json({
    //     message: "No applicants found",
    //   });
    // }
    res.json(applications);

    } catch (err) {
      res.status(400).json(err);
    }
  });

router.put("/applications/:id", jwtAuth, async (req, res) => {
  const user = req.user;
  const id = req.params.id;
  const status = req.body.status;
  console.log(req.params);
  console.log(req.body);
  if(user.type === "recruiter"){
    try{
      if(status === "accepted"){
        const application = await Application.findOne({
          _id: id,
          recruiterId: user._id,
        }).exec();

        if (application === null) {
          return res.status(404).json({
            message: "Application not found",
          });
        }

        const job = await Job.findOne({
          _id: application.jobId,
          userId: user._id,
        }).exec();

        if (job === null) {
          return res.status(404).json({
            message: "Job not found",
          });
        }

        const activeApplicationCount = await Application.countDocuments({
          jobId: job._id,
          status: "accepted",
        }).exec();

        if(activeApplicationCount < job.maxPositions){
          application.status = status;
          application.mom = req.body.mom;
          application.dateOfJoining = req.body.dateOfJoining;
          const [savedApplication] = await Promise.all([
            application.save(),
            Application.updateMany(
              {
                _id: { $ne: application._id },
                userId: application.userId,
                status: {
                  $nin: ["rejected", "deleted", "cancelled", "accepted", "finished"],
                },
              },
              {
                $set: {
                  status: "cancelled",
                },
              },
              { multi: true }
            ),
          ]);

          if (status === "accepted") {
            await Job.findOneAndUpdate(
              {
                _id: job._id,
                userId: user._id,
              },
              {
                $set: {
                  acceptedCandidates: activeApplicationCount + 1,
                },
              }
            );
          }

          return res.json({
            message: `Application ${status} successfully`,
          });
        }else {
          return res.status(400).json({
            message: "All positions for this job are already filled",
          });
        }
      }else{
        const updatedApplication = await Application.findOneAndUpdate(
          {
            _id: id,
            recruiterId: user._id,
            status: {
              $nin: ["rejected", "deleted", "cancelled"],
            },
          },
          {
            $set: {
              status: status,
              note: req.body.note,
            },
          }
        );

        if (updatedApplication === null) {
          return res.status(400).json({
            message: "Application status cannot be updated",
          });
        }

        return res.json({
          message: status === "finished" ? `Job ${status} successfully` : `Application ${status} successfully`,
        });
      }
    }catch(err){
      res.status(400).json(err);
    }
  }else{
    if (status === "cancelled") {
      try {
        const updatedApplication = await Application.findOneAndUpdate(
          {
            _id: id,
            userId: user._id,
          },
          {
            $set: {
              status: status,
            },
          }
        );

        return res.json({
          message: `Application ${status} successfully`,
        });
      } catch (err) {
        return res.status(400).json(err);
      }
    }else {
      return res.status(401).json({
        message: "You don't have permissions to update job status",
      });
    }
  }
  });




  router.put("/rating", jwtAuth, async (req, res) => {
    const user = req.user;
    const data = req.body;

    console.log("#########Rating##################")
    console.log(data);
    console.log(user);
  
    try {
      if (user.type === "recruiter") {
        // Can rate an applicant
        let rating = await Rating.findOne({
          senderId: user._id,
          receiverId: data.applicantId,
          category: "applicant",
        }).exec();
        
        if (rating === null) {
          console.log("new rating");
          const acceptedApplicant = await Application.countDocuments({
            userId: data.applicantId,
            recruiterId: user._id,
            status: {
              $in: ["accepted", "finished"],
            },
          });
  
          if (acceptedApplicant > 0) {
            // Add a new rating
            rating = new Rating({
              category: "applicant",
              receiverId: data.applicantId,
              senderId: user._id,
              rating: data.rating,
            });
  
            await rating.save();
  
            // Get the average of ratings
            const result = await Rating.aggregate([
              {
                $match: {
                  receiverId: new mongoose.Types.ObjectId(data.applicantId),
                  category: "applicant",
                },
              },
              {
                $group: {
                  _id: {},
                  average: { $avg: "$rating" },
                },
              },
            ]);
  
            if (result === null) {
              return res.status(400).json({
                message: "Error while calculating rating",
              });
            }
  
            const avg = result[0].average;
  
            const applicant = await JobApplicant.findOneAndUpdate(
              {
                userId: data.applicantId,
              },
              {
                $set: {
                  rating: avg,
                },
              }
            );
  
            if (applicant === null) {
              return res.status(400).json({
                message: "Error while updating the applicant's average rating",
              });
            }
  
            return res.json({
              message: "Rating added successfully",
            });
          } else {
            // You cannot rate
            return res.status(400).json({
              message: "The applicant didn't work under you. Hence, you cannot give a rating.",
            });
          }
        } else {
          rating.rating = data.rating;
          await rating.save();
  
          // Get the average of ratings
          const result = await Rating.aggregate([
            {
              $match: {
                receiverId: new mongoose.Types.ObjectId(data.applicantId),
                category: "applicant",
              },
            },
            {
              $group: {
                _id: {},
                average: { $avg: "$rating" },
              },
            },
          ]);
  
          if (result === null) {
            return res.status(400).json({
              message: "Error while calculating rating",
            });
          }
  
          const avg = result[0].average;
  
          const applicant = await JobApplicant.findOneAndUpdate(
            {
              userId: data.applicantId,
            },
            {
              $set: {
                rating: avg,
              },
            }
          );
  
          if (applicant === null) {
            return res.status(400).json({
              message: "Error while updating the applicant's average rating",
            });
          }
  
          return res.json({
            message: "Rating updated successfully",
          });
        }
      } else {
        // An applicant can rate a job
        let rating = await Rating.findOne({
          senderId: user._id,
          receiverId: data.jobId,
          category: "job",
        }).exec();
  
        console.log(user._id);
        console.log(data.jobId);
        console.log(rating);
  
        if (rating === null) {
          console.log(rating);
          const acceptedApplicant = await Application.countDocuments({
            userId: user._id,
            jobId: data.jobId,
            status: {
              $in: ["accepted", "finished"],
            },
          });
  
          if (acceptedApplicant > 0) {
            // Add a new rating
            rating = new Rating({
              category: "job",
              receiverId: data.jobId,
              senderId: user._id,
              rating: data.rating,
            });
  
            await rating.save();
  
            // Get the average of ratings
            const result = await Rating.aggregate([
              {
                $match: {
                  receiverId: new mongoose.Types.ObjectId(data.jobId),
                  category: "job",
                },
              },
              {
                $group: {
                  _id: {},
                  average: { $avg: "$rating" },
                },
              },
            ]);
  
            if (result === null) {
              return res.status(400).json({
                message: "Error while calculating rating",
              });
            }
  
            const avg = result[0].average;
  
            const foundJob = await Job.findOneAndUpdate(
              {
                _id: data.jobId,
              },
              {
                $set: {
                  rating: avg,
                },
              }
            );
  
            if (foundJob === null) {
              return res.status(400).json({
                message: "Error while updating the job's average rating",
              });
            }
  
            return res.json({
              message: "Rating added successfully",
            });
          } else {
            // You cannot rate
            return res.status(400).json({
              message: "You haven't worked for this job. Hence, you cannot give a rating.",
            });
          }
        } else {
          // Update the rating
          rating.rating = data.rating;
          await rating.save();
  
          // Get the average of ratings
          const result = await Rating.aggregate([
            {
              $match: {
                receiverId: new mongoose.Types.ObjectId(data.jobId),
                category: "job",
              },
            },
            {
              $group: {
                _id: {},
                average: { $avg: "$rating" },
              },
            },
          ]);
  
          if (result === null) {
            return res.status(400).json({
              message: "Error while calculating rating",
            });
          }
  
          const avg = result[0].average;
  
          const foundJob = await Job.findOneAndUpdate(
            {
              _id: data.jobId,
            },
            {
              $set: {
                rating: avg,
              },
            }
          );
  
          if (foundJob === null) {
            return res.status(400).json({
              message: "Error while updating the job's average rating",
            });
          }
  
          return res.json({
            message: "Rating updated successfully",
          });
        }
      }
    } catch (err) {
      console.log(err);
      res.status(400).json(err);
    }
  });
  router.get("/rating", jwtAuth, async (req, res) => {
    const user = req.user;
  
    try {
      const rating = await Rating.findOne({
        senderId: user._id,
        receiverId: req.query.id,
        category: user.type === "recruiter" ? "applicant" : "job",
      }).exec();
  
      if (rating === null) {
        return res.json({
          rating: -1,
        });
      }
  
      return res.json({
        rating: rating.rating,
      });
    } catch (err) {
      return res.status(400).json(err);
    }
  });
router.put("/applications/:id/cancel", jwtAuth, async (req, res) => {
    const user = req.user;
    const applicationId = req.params.id;
    console.log("request receievd");

    if (user.type !== "applicant") {
        return res.status(401).json({
            message: "You don't have permissions to cancel applications",
        });
    }

    try {
        const application = await Application.findOne({
            _id: applicationId,
            userId: user._id,
            status: {
                $in: ["applied", "shortlisted"],
            },
        }).exec();

        if (!application) {
            return res.status(404).json({
                message: "Application not found or cannot be canceled",
            });
        }

        // Update the application status to "cancelled"
        application.status = "cancelled";
        await application.save();

        return res.json({
            message: "Application canceled successfully",
        });
    } catch (err) {
        res.status(400).json(err);
    }
});


  
  export default router;
  


