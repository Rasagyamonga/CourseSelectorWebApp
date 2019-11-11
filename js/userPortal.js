'use strict';
// Sign out
$("#signOut").on('click', function(event) {event.preventDefault(); window.location.href = "/accounts/logout";});
$("#publicPage").on('click', function(event) {event.preventDefault();window.location.href = "/plans"});

let loggedInAs = "";
let currentlyEditing;

const userDataRequest = new Request('/accounts/userdata', {
	method: 'get'
})

document.addEventListener("DOMContentLoaded", function() {
	fetch(userDataRequest).then(function(res) {
		return res.json();
	}).then(function(response){
		const insert = document.querySelector('#header');
		insert.appendChild(document.createTextNode('\u00A0' + response.username));
		loggedInAs = response.username;
		console.log(response);
		drawPlansOnPage(response.plans);
	})
})

function drawPlansOnPage(planArr){
	const panes = document.querySelector('#cardsContainer');
	panes.innerHTML = '';

	planArr.sort((plan1,plan2) => {
		if (plan1.name < plan2.name){
			return -1;
		} else {
			return 1;
		}
	})

	planArr.forEach(function(plan){
		createNewPlan(plan.name, plan.major, plan._id, plan.public, plan.madeby)
	})
}

function createNewPlan(planName, major, id, pub, madeby){

    const CardsContainer = document.querySelector('#cardsContainer');
    const newDivCol = document.createElement('div');
    newDivCol.className = "col-lg-4";

    const newDivCard = document.createElement('div');
    newDivCard.className = "card";

    const newDivCardBody = document.createElement('div');
    newDivCardBody.className = "card-body";

    const newHeading5 = document.createElement('h5');
    newHeading5.className = "card-title text-muted text-uppercase text-center";
    newHeading5.appendChild(document.createTextNode(planName));

    const newHeading6 = document.createElement('h6');
    newHeading6.className = "card-price text-center";

    const newHR = document.createElement('hr');


    const newList = document.createElement('ul');
    newList.className = "fa-ul";


    const newListElement = document.createElement('li');
    newListElement.appendChild(document.createTextNode('Program: ' + major));

    newList.appendChild(newListElement) //added li to ul

    const newButtonEdit = document.createElement('a');
    newButtonEdit.className = "btn btn-block btn-primary text-uppercase";
    newButtonEdit.setAttribute("href", "#");
    newButtonEdit.setAttribute("name", id);
    newButtonEdit.appendChild(document.createTextNode("Edit Plan"))
		newButtonEdit.addEventListener('click', openEditModal);

    const newButtonViewMap = document.createElement('a');
    newButtonViewMap.className = "btn btn-block btn-primary text-uppercase";
    newButtonViewMap.setAttribute("href", "#");
    newButtonViewMap.setAttribute("name", id);
    newButtonViewMap.appendChild(document.createTextNode("View Course Map"))
		newButtonViewMap.addEventListener('click', openMap)

    newDivCardBody.appendChild(newHeading5) //added h5 to card-body
    newDivCardBody.appendChild(newHR) //added hr to card-body
    newDivCardBody.appendChild(newList) //added ul to card-body
    newDivCardBody.appendChild(newButtonViewMap)
    newDivCardBody.appendChild(newButtonEdit)


		const newButtonPublic = document.createElement('button');
		newButtonPublic.setAttribute('type', 'button');
    newButtonPublic.className = "btn btn-block btn-primary text-uppercase";
    newButtonPublic.setAttribute("href", "#");
    newButtonPublic.setAttribute("name", id);
		if (loggedInAs === madeby){
			if (pub){
	        newButtonPublic.appendChild(document.createTextNode("Make Private"));
	    } else {
	        newButtonPublic.appendChild(document.createTextNode("Make Public"));
	    }
			newButtonPublic.addEventListener('click', togglePublic);
		} else {
			newButtonPublic.classList.add('disabled');
			newButtonPublic.appendChild(document.createTextNode("Make Public"));
			newButtonPublic.setAttribute("disabled", "disabled");
		}
		newDivCardBody.appendChild(newButtonPublic);


    newDivCard.appendChild(newDivCardBody)
    newDivCol.appendChild(newDivCard)

    CardsContainer.appendChild(newDivCol)

}

function openEditModal(e){
		currentlyEditing = e.target.name;
		$('#editPlanModal').modal('toggle');
}

function openMap(e){
	localStorage.mapViewing = e.target.name;
	window.location = '/map';
}

function togglePublic(e){
	const body = {
		plan: e.target.name
	}

	const toggleReq = new Request('/accounts/plans/public', {
		method: 'PATCH',
		body: JSON.stringify(body),
		headers:{
			'Content-Type': 'application/json'
		}
	})

	fetch(toggleReq).then(res => {
		return res.json();
	}).then(response => {
		if (response.success){
			drawPlansOnPage(response.plans);
		} else {
			// ERROR HERE
		}
	})
}

//adding event listener to new plan button

const button = document.querySelector('#planButton');
button.addEventListener('click', showPlanModal)

//drops down create plan option

function showPlanModal(){
    $('#newPlanModal').modal('toggle');
}

//adding event listener to create plan button
const createPlanButton = document.querySelector('#createPlan');
createPlanButton.addEventListener('click', submitNewPlan);

//sends value of name and major submitted to server
function submitNewPlan(){
    const planName = document.querySelector('#newName').value;
    const planMajor = document.querySelector('#newMajor').value;

    const body = {
        "name":planName,
        "major":planMajor
    }


    // Request
    const request = new Request('/accounts/plans', {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    })

    fetch(request).then(function(res) {
        console.log(res);
        return res.json();
    }).then(function (response) {
        console.log(response);
        drawPlansOnPage(response.plans);
        $('#newPlanModal').modal('toggle');
    })
}

const saveChanges = document.querySelector('#changePlan');
saveChanges.addEventListener('click', pushChanges);
function pushChanges(){
		const newName = document.querySelector('#changeName').value;
		const newMajor = document.querySelector('#changeMajor').value;

    const body = {}
    if (newName !== ''){
      body.name = newName;
    }
    if (newMajor !== ''){
      body.major = newMajor;
    }

    if (jQuery.isEmptyObject(body)){
      console.log('invalid input')
    } else {
      body.plan = currentlyEditing;

      const editReq = new Request('/accounts/plan',{
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
      })

      fetch(editReq).then(function(res){
        return res.json();
      }).then(function (response){
        drawPlansOnPage(response.plans);
      })
    }
    $('#editPlanModal').modal('toggle');
}

const deletePlan = document.querySelector('#deletePlan');
deletePlan.addEventListener('click', sendDelete);
function sendDelete(){
		fetch(userDataRequest).then(function(res) {
			return res.json();
		}).then(function(response){
			const plan = response.plans.find(plan => {
				return plan._id === currentlyEditing;
			})

			const body = {
				plan: currentlyEditing,
				user: loggedInAs
			}
			if (plan.madeby === loggedInAs && plan.public){
				body.remPublic = true;
			}

			const delReq = new Request('/account/plans/delete', {
				method: 'DELETE',
				body: JSON.stringify(body),
				headers: {
					'Content-Type': 'application/json'
				}
			})

			fetch(delReq).then( res => {
				return res.json();
			}).then( response => {
				if (response.plans){
					drawPlansOnPage(response.plans);
					$('#editPlanModal').modal('toggle');
				} else {
					console.log('delete failed');
				}
			})
		})
}
