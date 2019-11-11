$("#signOut").on('click', function(event) {event.preventDefault(); window.location.href = "/accounts/logout";});

const userDataRequest = new Request('/accounts/userdata', {
	method: 'get'
})

const allUsersRequest = new Request('/accounts', {
	method: 'get'
})

const getAllPlans = new Request('/plans/all', {
  method: 'GET'
})

document.addEventListener("DOMContentLoaded", function() {
	fetch(userDataRequest).then(function(res) {
		return res.json();
	}).then(function(response){
		const insert = document.querySelector('#userHeader');
		insert.appendChild(document.createTextNode(response.username));
	})
	drawPlans();

	drawUsers();
})

function drawPlans(){
	fetch(getAllPlans).then(res => {
		return res.json()
	}).then( response => {
		const sorted = response.plans.sort( (plan1, plan2) => {
			if (plan1.name < plan2.name){
				return -1
			} else {
				return 1
			}
		})
		const planTable = document.querySelector('#planTableBody');
		planTable.innerHTML = '';
		sorted.forEach(plan => {
			const newRow = document.createElement('tr');

			const planName = document.createElement('td');
			planName.classList.add('searchable');
			const planNameCont = document.createElement('span');
			planNameCont.appendChild(document.createTextNode(plan.name));
			planName.appendChild(planNameCont);
			newRow.appendChild(planName);

			const maker = document.createElement('td');
			maker.appendChild(document.createTextNode(plan.madeby));
			newRow.appendChild(maker);

			const reviews = document.createElement('td');
			reviews.appendChild(document.createTextNode(plan.reviews.length));
			newRow.appendChild(reviews);

			const view = document.createElement('td');

			const viewButton = document.createElement('input');
			viewButton.setAttribute('type', 'submit');
			viewButton.setAttribute('value', 'view');
			viewButton.setAttribute('name', plan._id);
			viewButton.addEventListener('click', showPlanReviews);

			view.appendChild(viewButton);
			newRow.appendChild(view);

			planTable.appendChild(newRow);
		})
	})
}

function showPlanReviews(e){
	const getReviews = new Request('/plans/reviews/' + e.target.name, {
		method: 'GET'
	})

	fetch(getReviews).then( res => {
		return res.json()
	}).then( response => {
		const reviews = response.reviews;

    const modalLabel = document.querySelector('#seePlanRevLabel');
    modalLabel.innerHTML = '';
    modalLabel.appendChild(document.createTextNode("Reviews for " + response.name + ' by ' + response.maker));

    document.querySelector("#p-review-spinner").style.display = 'none';
    const reviewList = document.querySelector("#planRevList")
    reviewList.innerHTML = ''

    if (reviews.length == 0) {
      let errortext = document.createElement("h4")
      errortext.appendChild(document.createTextNode("No reviews found for this plan"))
      reviewList.appendChild(errortext)
    } else {
      reviews.forEach((review) => {
        const reviewHeader = document.createElement("div")

        const reviewBox = document.createElement("div")
        reviewBox.className = "reviewItem";

        const titleText = document.createElement("h4")
        titleText.appendChild(document.createTextNode("Review by - " + review.user))
        titleText.className = "reviewHeader"
        reviewHeader.appendChild(titleText)

        for (let i = 0; i < 5; i++) {
          const star = document.createElement("span")
          star.className += "fa fa-star"
          if (i < review.rating) {
            star.className += " checked"
          }
          reviewHeader.appendChild(star)
        }

				const removeButton = document.createElement('button');
				removeButton.setAttribute('type', 'button');
				removeButton.classList.add("btn", "btn-block", "btn-danger", "modal-button");
				removeButton.setAttribute("href", "#");
				removeButton.setAttribute("name", e.target.name + '/' + review._id);
				removeButton.addEventListener('click', removePlanReview);
				reviewHeader.appendChild(removeButton);

        reviewBox.appendChild(reviewHeader)
        reviewBox.appendChild(document.createTextNode(review.text))

        reviewList.appendChild(reviewBox)
      })
    }
	})

	$('#seePlanRevModal').modal('toggle');
}

function removePlanReview(e){
	const planId = e.target.name.split('/')[0];
	const reviewId = e.target.name.split('/')[1];

	const delRequest = new Request('/plans/' + planId + '/' + reviewId, {
		method: 'DELETE'
	})

	fetch(delRequest).then( res => {
		return res.json()
	}).then( response => {
		if (response.success){
			e.target.parentElement.parentElement.style.display = 'none'
			drawPlans()
		}
	})
}

function drawUsers(){
	fetch(allUsersRequest).then(function(res) {
		return res.json();
	}).then(function(response){
		const userTable = document.querySelector('#userTable');
		userTable.innerHTML = '';
		response.accounts.forEach(function(user) {
			const newRow = document.createElement('tr');

			const username = document.createElement('td');
			username.classList.add('searchable');
			username.appendChild(document.createTextNode(user.username));
			newRow.appendChild(username);

			const ban = document.createElement('td');
			const banButton = document.createElement('input');
			banButton.setAttribute('type','submit');
			banButton.setAttribute('name', user.id);
			if (user.banned){
					banButton.setAttribute('value','Unban User');
					banButton.addEventListener('click', unbanUser);
			} else {
					banButton.setAttribute('value', 'Ban User');
					banButton.addEventListener('click', banUser);
			}
			ban.appendChild(banButton);
			newRow.appendChild(ban);

			const remove = document.createElement('td');
			const remButton = document.createElement('input');
			remButton.setAttribute('type','submit');
			remButton.setAttribute('value','Remove Account');
			remButton.setAttribute('name', user.id);
			remButton.addEventListener('click', removeAccount);
			remove.appendChild(remButton);
			newRow.appendChild(remove);

			userTable.appendChild(newRow);
		})
	})
}

function banUser(e){
	const banRequest = new Request('/accounts/'+ e.target.name +'/ban', {
		method: 'PATCH'
	})

	fetch(banRequest).then(function (res){
		return res.json();
	}).then(function (response){
		if (response.issue){
			console.log('ban failed');
		} else {
			drawUsers();
		}
	})
}

function unbanUser(e){
	const unbanRequest = new Request('/accounts/'+ e.target.name +'/unban', {
		method: 'PATCH'
	})

	fetch(unbanRequest).then(function (res){
		return res.json();
	}).then(function (response){
		if (response.issue){
			console.log('unban failed');
		} else {
			drawUsers();
		}
	})
}

function removeAccount(e){
	const delAccReq = new Request('/accounts/' + e.target.name, {
		method: 'DELETE'
	})
	fetch(delAccReq).then( res => {
		return res.json()
	}).then( response => {
		if (response.success){
			e.target.parentElement.parentElement.style.display = 'none';
		}
	})
}

// creates and maintains tab funcionality
$(document).ready(function(){

	$('ul.tabs li').click(function(){
		var tab_id = $(this).attr('data-tab');

		$('ul.tabs li').removeClass('current');
		$('.tab-content').removeClass('current');

		$(this).addClass('current');
		$("#"+tab_id).addClass('current');
	})

})

// creates and maintaings search/filter functionality for user and admin tables
const searchCourses = document.querySelector('#searchCoursesBut');
searchCourses.addEventListener('click', displayCourses);
function displayCourses(){
	const courseCode = document.querySelector('#searchBarInput').value;
	const results = document.querySelector('#courseTableBody');
	results.innerHTML = '';

	const body = {
			"input": courseCode
	}

	const courseSearchReq = new Request('/courses/query', {
			method: 'post',
			body: JSON.stringify(body),
			headers: {
					'Content-Type': 'application/json'
			}
	})

	fetch(courseSearchReq).then(function (res) {
			return res.json();
	}).then(function (response) {
			const courses = response.courses;
			courses.sort(function (course1, course2) {
					if (course1.coursecode < course2.coursecode) {
							return -1;
					} else {
							return 1;
					}
			});
			courses.forEach(course => {
				const newRow = document.createElement('tr');
				const rowCode = document.createElement('td');
				rowCode.appendChild(document.createTextNode(course.coursecode));
				const rowName = document.createElement('td');
				rowName.appendChild(document.createTextNode(course.name));
				const rowNum = document.createElement('td');
				rowNum.appendChild(document.createTextNode(course.reviews.length));
				const rowView = document.createElement('td');
				const viewButton = document.createElement('input');
				viewButton.setAttribute('type', 'submit');
				viewButton.setAttribute('value', 'view');
				viewButton.setAttribute('name', course._id);
				viewButton.addEventListener('click', showReviews);
				rowView.appendChild(viewButton);

				newRow.appendChild(rowCode);
				newRow.appendChild(rowName);
				newRow.appendChild(rowNum);
				newRow.appendChild(rowView);
				results.appendChild(newRow);
			})
	})
}

function showReviews(e){
	const courseSearchReq = new Request('/courses/' + e.target.name, {
			method: 'get'
	})

	fetch(courseSearchReq).then(function (res) {
			return res.json();
	}).then(function (response) {
			const reviews = response.course.reviews;
			document.querySelector("#review-spinner").style.display = 'none';
			const reviewList = document.querySelector("#reviewList")
			reviewList.innerHTML = ''

			const modalLabel = document.querySelector('#reviewModalLabel');
			modalLabel.appendChild(document.createTextNode('Reviews for ' + response.course.coursecode));

			console.log(reviews)
			if (reviews.length == 0) {
					errortext = document.createElement("h4")
					errortext.appendChild(document.createTextNode("No reviews found for this course"))
					reviewList.appendChild(errortext)
			} else {
					reviews.forEach((review) => {
							const reviewHeader = document.createElement("div")

							const reviewBox = document.createElement("div")
							reviewBox.className = "reviewItem";

							const titleText = document.createElement("h4")
							titleText.appendChild(document.createTextNode("Review by - " + review.user))
							titleText.className = "reviewHeader"
							reviewHeader.appendChild(titleText)

							for (let i = 0; i < 5; i++) {
									const star = document.createElement("span")
									star.className += "fa fa-star"
									if (i < review.rating){
											star.className += " checked"
									}
									reviewHeader.appendChild(star)
							}

							reviewBox.appendChild(reviewHeader)
							reviewBox.appendChild(document.createTextNode(review.text))

							const removeButton = document.createElement('button');
							removeButton.setAttribute('type', 'button');
					    removeButton.classList.add("btn", "btn-block", "btn-danger", "modal-button");
					    removeButton.setAttribute("href", "#");
					    removeButton.setAttribute("name", response.course._id + '/' + review._id);
							removeButton.addEventListener('click', removeCourseReview);
							reviewHeader.appendChild(removeButton);

							reviewList.appendChild(reviewBox);
					})
			}
	})
	$('#seeReviewModal').modal('toggle');
}

function removeCourseReview(e){
	const courseId = e.target.name.split('/')[0];
	const reviewId = e.target.name.split('/')[1];
	console.log(courseId)

	const delRequest = new Request('/courses/' + courseId + '/' + reviewId, {
		method: 'DELETE'
	})

	fetch(delRequest).then( res => {
		return res.json()
	}).then( response => {
		if (response.success){
			e.target.parentElement.parentElement.style.display = 'none'
			drawPlans()
		}
	})
}

function searchTableUsers() {
    var inputUser;
    var toUpperUser;
    var flagUser;
    var tableUser;
    var trUser;
    var tdUser, iUser, jUser;
    inputUser = document.getElementById("searchBarUsers");
    toUpperUser = inputUser.value.toUpperCase();
    tableUser = document.getElementById("myTableUsers");
    trUser = tableUser.getElementsByTagName("tr");
    for (iUser = 0; iUser < trUser.length; iUser++) {
        tdUser = trUser[iUser].getElementsByTagName("td");
        for (jUser = 0; jUser < tdUser.length; jUser++) {
            if (tdUser[jUser].innerHTML.toUpperCase().indexOf(toUpperUser) > -1) {
                flagUser = true;
            }
        }
        if (flagUser) {
            trUser[iUser].style.display = "";
            flagUser = false;
        } else if (trUser[iUser].classList.contains('header')){
						flag = false;
			  } else {
            trUser[iUser].style.display = "none";
        }
    }
}

function searchTablePlans() {
    let flagPlan;
    let tdPlan, iPlan, jPlan;
    let inputPlan = document.getElementById("searchBarPlans");
		let toUpperPlan = inputPlan.value.toUpperCase();
    let tablePlans = document.getElementById("planTable");
    let trPlans = tablePlans.getElementsByTagName("tr");
    for (iPlan = 0; iPlan < trPlans.length; iPlan++) {
        tdPlan = trPlans[iPlan].getElementsByTagName("td");
        for (jPlan = 0; jPlan < tdPlan.length; jPlan++) {
            if (tdPlan[jPlan].innerHTML.toUpperCase().indexOf(toUpperPlan) > -1) {
                flagPlan = true;
            }
        }
        if (flagPlan) {
            trPlans[iPlan].style.display = "";
            flagPlan = false;
        } else if (trPlans[iPlan].classList.contains('header')){
						flag = false;
			  } else {
            trPlans[iPlan].style.display = "none";
        }
    }
}
