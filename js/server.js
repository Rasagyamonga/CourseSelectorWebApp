'use strict'

const express = require('express');
const parser = require('body-parser');
const {ObjectID} = require('mongodb');
const {mongoose} = require('./db/mongoose');
const session = require('express-session');
const fs = require('fs');

const port = process.env.PORT || 3000;

// const {User} = require('models/user');
// const {Admin} = require('models/admin');
const {Account} = require('./models/account');
const {Course} = require('./models/course');
const {PublicPlan} = require('./models/publicplan');

const serv = express();
serv.use("/js", express.static(__dirname + '/pages/js'));
serv.use("/css", express.static(__dirname + '/pages/css'));
serv.use("/assets", express.static(__dirname + '/pages/assets'));
serv.use(parser.json());

serv.use(session({
	secret: 'a1bx23aa',
	resave: false,
	saveUninitialized: false,
	cookie: {
		expires: 600000,
		httpOnly: true
	}
}))

const sessionChecker = (req, res, next) => {
	if (req.session.account) {
		next();
	} else {
		res.sendFile(__dirname + '/pages/index.html');
	}
}

serv.get('/', sessionChecker, (req, res) => {
	if (req.session.account.permissions === 'Admin'){
		res.sendFile(__dirname + '/pages/adminPortal.html');
	} else {
		res.sendFile(__dirname + '/pages/updatedUserPortal.html');
	}
})

serv.get('/portal', sessionChecker, (req, res) => {
	if (req.session.account.permissions === 'Admin'){
		res.sendFile(__dirname + '/pages/adminPortal.html');
	} else {
		res.sendFile(__dirname + '/pages/updatedUserPortal.html');
	}
})

serv.get('/map', sessionChecker, (req, res) => {
	res.sendFile(__dirname + '/pages/map_main.html');
})

serv.get('/plans', sessionChecker, (req, res) => {
	res.sendFile(__dirname + '/pages/updatedPublicPage.html');
})

serv.get('/accounts/userdata', (req, res) => {
	if (req.session.account){
		Account.find({"_id": ObjectID(req.session.account._id)}).then( account => {
			if (account){
				res.status(200).json({username: account[0].username, plans: account[0].plans});
			} else {
				res.status(500).json({});
			}
		})
	} else {
		res.status(400).send();
	}
})

serv.get('/plans/all', (req, res) => {
	PublicPlan.find().then( (plans) => {
		res.status(200).json({plans: plans});
	}, (error) => {
		res.status(500).json({});
	})
})

serv.post('/accounts/login', (req, res) => {
	const username = req.body.username;
	const password = req.body.password;

	Account.validateLogin(username, password).then((account) => {
		if (!account) {
			res.status(400).json({success: false});
		} else {
			if (account.banned){
				res.status(400).json({banned: true});
			} else {
				req.session.account = {
					_id: account._id,
					username: account.username,
					permissions: account.permissions,
					banned: account.banned
				}
				console.log(req.session.account);
				res.status(200).json({success: true});
			}
		}
	}).catch((error) => {
		res.status(400).json({success: false});
	})
})

serv.get('/accounts/logout', (req,res) => {
	req.session.destroy((error) => {
		if (error) {
			res.status(500).send(error);
		} else {
			res.sendFile(__dirname + '/pages/index.html');
		}
	})
})

serv.post('/accounts', (req, res) => {
	const account = new Account({
		username: req.body.username,
		password: req.body.password,
		permissions: 'User',
		banned: false
	})

	account.save().then((result) => {
		req.session.account = {
			_id: result._id,
			username: result.username,
			permissions: result.permissions,
			banned: result.banned
		}
		res.send(result);
	}, (error) => {
		console.log('bad request: ' + req.body.username + " " + req.body.password);
		res.status(400).send(error);
	})
})

serv.delete('/accounts/:uid', (req, res) => {
	if (req.session.account.permissions === 'Admin'){
		Account.remove({"_id": ObjectID(req.params.uid)}).then( account => {
			if (account){
				res.status(200).json({success: true})
			} else {
				res.status(500).json({success: false})
			}
		}).catch( err => {
			res.status(404).json({success: false})
		})
	} else {
		res.status(400).json({success: false})
	}
})

serv.post('/admin', (req, res) => {
	if (req.body.code === "a12sxfe32sdfa2"){
		const account = new Account({
			username: req.body.username,
			password: req.body.password,
			permissions: 'Admin',
			banned: false
		})

		account.save().then((result) => {
			req.session.account = {
				_id: result._id,
				username: result.username,
				permissions: result.permissions,
				banned: result.banned
			}
			res.send(result);
		}, (error) => {
			console.log('bad request: ' + req.body.username + " " + req.body.password);
			res.status(400).send(error);
		})
	} else {
		res.status(404).send();
	}
})

serv.get('/accounts', (req, res) => {
	if (req.session.account.permissions === 'Admin'){
		Account.find({ permissions: { $eq: 'User' } }).then( (accounts) => {
			let accountInfo = [];
			accounts.forEach(function(account){
				accountInfo.push({
					id: account._id,
					username: account.username,
					banned: account.banned
				})
			})
			res.status(200).json({accounts: accountInfo});
		}, (error) => {
			res.status(500).send(error);
		})
	} else {
		res.status(404).send();
	}
})

serv.patch('/accounts/:id/ban', (req, res) => {
	if (req.session.account.permissions === 'Admin'){
		const id = req.params.id;

		Account.findByIdAndUpdate(id, {$set: {banned: true}}, {new: true}).then( (account) => {
			if (!account) {
				res.status(404).json({issue: true});
			} else {
				res.status(200).json({issue: false});
			}
		}).catch((error) => {
			res.status(400).json({issue: true});
		})
	}
})

serv.patch('/accounts/:id/unban', (req, res) => {
	if (req.session.account.permissions === 'Admin'){
		const id = req.params.id;

		Account.findByIdAndUpdate(id, {$set: {banned: false}}, {new: true}).then( (account) => {
			if (!account) {
				res.status(404).json({issue: true});
			} else {
				res.status(200).json({issue: false});
			}
		}).catch((error) => {
			res.status(400).json({issue: true});
		})
	}
})

serv.post('/courses/query', (req, res) => {
	const code = new RegExp(req.body.input, "i");
	Course.find({coursecode: code}).limit(100).then( (courses) => {
		res.status(200).json({courses: courses});
	}, (error) => {
		res.status(500).send(error);
	})
})

serv.get('/courses/:id', (req, res) => {
	const id = req.params.id;

	if (!ObjectID.isValid(id)){
		return res.status(404).send();
	}

	Course.findById(id).then( (course) => {
		if (!course){
			res.status(404).send();
		} else {
			res.status(200).json({course: course});
		}
	}, (error) => {
		res.status(500).send(error);
	})
})

serv.patch('/accounts/plans', (req, res) => {
	if (req.session.account){
		const newPlan = {
			_id: new ObjectID(),
			madeby: req.session.account.username,
			main: false,
			name: req.body.name,
			major: req.body.major,
			graph: null,
			public: false
		}

		Account.findByIdAndUpdate(req.session.account._id, {$push: {plans: newPlan}}, {new: true}).then( (account) => {
			if (!account) {
				res.status(404).json({issue:"push failed"});
			} else {
				res.status(200).json({plans: account.plans});
			}
		}).catch((error) => {
			res.status(400).json({issue:"account not found"});
		})
	} else {
		res.status(400).json({issue:"user not logged in"});
	}
})

serv.delete('/account/plans/delete', async (req, res) => {
	if (req.session.account.username === req.body.user){
		const userAcc = await Account.find({"_id": ObjectID(req.session.account._id)});
		if (!userAcc){
			res.status(500).json({issue: true});
			return;
		}

		const plan2Del = userAcc[0].plans.find(plan => {
			return plan._id == req.body.plan;
		})

		if (req.body.remPublic) {
			PublicPlan.remove({"_id": ObjectID(plan2Del._id)}).then( plan => {
				console.log(plan);
			}).catch( err => {
				return;
			})
		}

		Account.findByIdAndUpdate(req.session.account._id, {$pull: {plans: plan2Del}}, {new: true}).then( (account) => {
			if (!account) {
				res.status(404).json({issue: true});
			} else {
				res.status(200).json({plans: account.plans});
			}
		}).catch((error) => {
			res.status(400).json({issue: true});
		})
	} else {
		res.status(400).json({issue: true});
	}
})

serv.patch('/accounts/plan', async (req, res) => {
	const planId = req.body.plan;

	const userAcc = await Account.find({"_id": ObjectID(req.session.account._id)});
	if (!userAcc){
		res.status(500).json({issue: true});
		return;
	}

	let editPlan = userAcc[0].plans.find((plan) => {
		return plan._id == planId;
	})

	const changes = {};
	if (req.body.name){
		changes.name = req.body.name;
	}
	if (req.body.major){
		changes.major = req.body.major;
	}

	if (editPlan.public && editPlan.madeby === req.session.account.username){
		PublicPlan.findByIdAndUpdate(editPlan._id, {$set: changes}).then( newPlan => {
			if (!newPlan){
				return;
			}
		})
	}

	Account.findByIdAndUpdate(req.session.account._id, {$pull: {plans: editPlan}}, {new: true}).then( (account) => {
		if (!account) {
			res.status(404).json({issue:"pull failed"});
		} else {
			if (req.body.name){
				editPlan.name = req.body.name;
			}
			if (req.body.major){
				editPlan.major = req.body.major;
			}
			Account.findByIdAndUpdate(req.session.account._id, {$push: {plans: editPlan}}, {new: true}).then( (account) => {
				if(!account){
					res.status(404).json({issue:"push failed"});
				} else {
					res.status(200).json({plans: account.plans});
				}
			})
		}
	}).catch((error) => {
		res.status(400).json({issue:"account not found"});
	})
})

serv.patch('/accounts/plan/map', async (req, res) => {
	const planId = req.body.plan;

	const userAcc = await Account.find({"_id": ObjectID(req.session.account._id)});
	if (!userAcc){
		res.status(500).json({issue: true});
		return;
	}

	let editPlan = userAcc[0].plans.find((plan) => {
		return plan._id == planId;
	})

	if (editPlan.public && editPlan.madeby === req.session.account.username){
		PublicPlan.findByIdAndUpdate(editPlan._id, {$set: {graph: req.body.graph}}).then( newPlan => {
			if (!newPlan){
				return;
			}
		})
	}

	Account.findByIdAndUpdate(req.session.account._id, {$pull: {plans: editPlan}}, {new: true}).then( (account) => {
		if (!account) {
			res.status(404).json({issue:"pull failed"});
		} else {
			editPlan.graph = req.body.graph;
			Account.findByIdAndUpdate(req.session.account._id, {$push: {plans: editPlan}}, {new: true}).then( (account) => {
				if(!account){
					res.status(404).json({issue:"push failed"});
				} else {
					res.status(200).json({success: true});
				}
			})
		}
	}).catch((error) => {
		res.status(400).json({issue:"account not found"});
	})
})

serv.patch('/accounts/plans/public', async (req, res) => {
	const planId = req.body.plan;

	const userAcc = await Account.find({"_id": ObjectID(req.session.account._id)});
	if (!userAcc){
		res.status(500).json({issue: true});
		return;
	}

	let editPlan = userAcc[0].plans.find((plan) => {
		return plan._id == planId;
	})

	if (editPlan.public){
		PublicPlan.remove({"_id": ObjectID(editPlan._id)}).then( plan => {
			console.log(plan);
		}).catch( err => {
			return;
		})
	} else {
		const newPubPlan = new PublicPlan ({
			_id: editPlan._id,
			madeby: editPlan.madeby,
			main: false,
			name: editPlan.name,
			major: editPlan.major,
			graph: editPlan.graph,
			public: true
		})

		newPubPlan.save().then((result) => {
			console.log('success');
		}, (error) => {
			return;
		})
	}

	Account.findByIdAndUpdate(req.session.account._id, {$pull: {plans: editPlan}}, {new: true}).then( (account) => {
		if (!account) {
			res.status(404).json({issue:"pull failed"});
		} else {
			editPlan.public = !(editPlan.public);
			Account.findByIdAndUpdate(req.session.account._id, {$push: {plans: editPlan}}, {new: true}).then( (account) => {
				if(!account){
					res.status(404).json({issue:"local update failed"});
				} else {
					res.status(200).json({success: true, plans: account.plans});
				}
			})
		}
	}).catch((error) => {
		res.status(400).json({issue:"account not found"});
	})
})

serv.post('/courses/review', async (req, res) => {
	const courseCode = req.body.code;
	// MAYBE ALSO ADD USER TO REVIEW
	const review = {rating: req.body.rating, text: req.body.text, user: req.session.account.username}
	const course = await Course.find({coursecode: {$eq:courseCode}})
	console.log(course);
	if (course.length > 0) {
		const existing = course[0].reviews.find(review => {
      return review.user === req.session.account.username;
    })
		if (existing){
			await Course.findByIdAndUpdate(course[0]._id, {$pull: {reviews: existing}}, {new: true})
		}
		Course.findByIdAndUpdate(course[0]._id, {$push: {reviews: review}}, {new: true}).then( (found) => {
      if (!found){
        res.status(404).json({success: false});
      } else {
        res.status(200).json({success: true});
      }
    })
	}
})

serv.delete('/courses/:cid/:rid', async (req, res) => {
	if (req.session.account && req.session.account.permissions === 'Admin'){
		const course = await Course.find({_id: {$eq: ObjectID(req.params.cid)}}).catch( err => {
			res.status(400).json({success: false})
			return;
		})
		const review = await course[0].reviews.find( rev => {
			console.log(rev._id + ' ' + req.params.rid)
			return rev._id == req.params.rid
		})
		console.log(review);
		Course.findByIdAndUpdate(req.params.cid, {$pull: {reviews: review}}, {new: true}).then( course => {
			if (course){
				res.status(200).json({success: true, reviews: course.reviews.length})
			} else {
				res.status(500).json({success: false})
			}
		}).catch(err => {
			res.status(404).json({success: false})
		})
	} else {
		res.status(400).json({success: false})
	}
})

serv.post('/plans/graph', async (req, res) => {
	const planId = req.body.planId;
	if (!req.session.account){
		res.status(404).json({issue: "Error not logged in"});
	} else {
		const userAcc = await Account.find({"_id": ObjectID(req.session.account._id)});
		if (!userAcc){
			res.status(500).json({issue: true});
			return;
		}
		console.log(userAcc);
		console.log(userAcc[0].plans)
		const viewPlan = userAcc[0].plans.find((plan) => {
			return plan._id == planId;
		})
		res.status(200).json({graph: viewPlan.graph, name: viewPlan.name});
	}
})

serv.post('/plans/import', async (req, res) => {
    const plan = await PublicPlan.find({_id: {$eq: req.body.plan}});
		if (plan && plan[0].madeby !== req.session.account.username){
			const userAcc = await Account.find({"_id": ObjectID(req.session.account._id)});
			if (!userAcc){
				res.status(500).json({issue: true});
				return;
			}
			const existing = userAcc[0].plans.find(plan => {
				return plan._id == req.body.plan
			})

			if (existing){
				await Account.findByIdAndUpdate(req.session.account._id, {$pull: {plans: existing}}, {new: true}).then( account => {
					if (!account){
						res.status(500).json({issue: true});
						return;
					}
				})
			}

			const importing = {
				_id: plan[0]._id,
				madeby: plan[0].madeby,
				main: false,
				name: plan[0].name,
				major: plan[0].major,
				graph: plan[0].graph,
				public: true
			}

			Account.findByIdAndUpdate(req.session.account._id, {$push: {plans: importing}}, {new: true}).then( account => {
				if (!account) {
						res.status(404).json({success: false});
				} else {
						res.status(200).json({success: true});
				}
			}).catch((error) => {
            res.status(400).json({success: false});
      })
		}
})

serv.get('/plans/reviews/:id', (req, res) => {
	const planId = req.params.id;
	PublicPlan.find({_id: {$eq: planId}}).then( plan => {
		if (plan){
			res.status(200).json({reviews: plan[0].reviews, name: plan[0].name, maker: plan[0].madeby})
		} else {
			res.status(404).json({reviews: []})
		}
	}).catch(error => {
		res.status(400).json({reviews: []})
	})
})

serv.patch('/plans/reviews', async (req, res) => {
	const planId = req.body.plan;
	const review = {_id: new ObjectID(), rating: req.body.rating, text: req.body.text, user: req.session.account.username}
	const plan = await PublicPlan.find({_id: {$eq: planId}});
	if (plan.length > 0){
		const existing = plan[0].reviews.find(review => {
			return review.user === req.session.account.username;
		})
		if (existing){
			await PublicPlan.findByIdAndUpdate(plan, {$pull: {reviews: existing}}, {new: true})
		}
		PublicPlan.findByIdAndUpdate(plan, {$push: {reviews: review}}, {new: true}).then( success => {
			if (!success){
        res.status(404).json({success: false});
      } else {
        res.status(200).json({success: true});
      }
		})
	} else {
		res.status(400).json({success: false})
	}
})

serv.delete('/plans/:pid/:rid', async (req, res) => {
	if (req.session.account && req.session.account.permissions === 'Admin'){
		const plan = await PublicPlan.find({_id: {$eq: ObjectID(req.params.pid)}}).catch( err => {
			res.status(400).json({success: false})
			return;
		})
		const review = await plan[0].reviews.find( rev => {
			return rev._id == req.params.rid
		})

		PublicPlan.findByIdAndUpdate(req.params.pid, {$pull: {reviews: review}}, {new: true}).then( plan => {
			if (plan){
				res.status(200).json({success: true, reviews: plan.reviews.length})
			} else {
				res.status(500).json({success: false})
			}
		}).catch(err => {
			res.status(404).json({success: false})
		})
	} else {
		res.status(400).json({success: false})
	}
})

serv.get('/plans/graph/:id', (req, res) => {
	const planId = req.params.id;
	PublicPlan.find({_id: {$eq: planId}}).then( plan => {
		if (plan.length > 0){
			res.status(200).json({graph: plan[0].graph});
		} else {
			res.status(404).json({graph: {}});
		}
	}).catch( error => {
		res.status(400).json({graph: {}});
	})
})

function parsePrerequisites(rawarray) {
    if (!rawarray) {
        return []
    }
    let logicalParse = rawarray.split(/[;,]/)
    logicalParse = logicalParse.map((val) => val.split('/'))

    logicalParse = logicalParse.reduce((res, val) => {
        const ORList = val.reduce((result, val2) => {
            try {
                const coursecode = /[A-Z]{3}[0-9]{3}/.exec(val2)[0]
                result.push(coursecode)
                return result
            } catch (error) {
                return result
            }
        }, [])
        if (ORList.length > 0) {
            res.push(ORList)
        }
        return res
    }, [])

    return logicalParse
}

serv.patch('/courses/generate/:password', (req, res) => {
	if (req.params.password === '309team46'){
		const rawdata = fs.readFileSync('courses.json', 'utf-8')

		const jsondata = rawdata.split('\n').map((record) => JSON.parse(record))

		let filtered_data = []
		let prevCourse = jsondata[0];
		let temp = "";
		jsondata.forEach((val) => {
		    if (!isNaN(val.code[3]) && val.code[7] == 1) {
		        if (val.code.slice(0,6) != temp){
		            filtered_data.push(prevCourse)
		        }
		        prevCourse = val;
		        temp = val.code.slice(0,6);
		    }
		});

		const coursearray = filtered_data.map((rawcourse) => {
		    return {
		        coursecode: rawcourse.code.slice(0,6),
		        name: rawcourse.name,
		        description: rawcourse.description,
		        department: rawcourse.department,
		        credits: rawcourse.code[6] == 'Y' ? 1 : 0,
		        prerequisites: parsePrerequisites(rawcourse.prerequisites),
		        breadths: rawcourse.breadths,
		        reviews: []
		    }
		})

		coursearray.forEach((val) => {
		    const course = new Course(val)
		    course.save().then(ok => {

				}).catch( err => {
					console.log(err)
				})
		})
		res.status(200).send();
	}
	res.status(400).send();
})

serv.listen(port, () => {
  console.log(`Server listening on port ${port}`);
})
