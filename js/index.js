'use strict';

// Let's first get the elements we need
const UserForm = document.querySelector('#loginButton')
UserForm.addEventListener('click', login)

// Function to login
function login() {
	// First, we need to get the student's name and course
	// from the text fields in the form
	const userName = document.querySelector('#UserName').value
	const userPassword = document.querySelector('#UserPassword').value

	const body = {
		"username":userName,
		"password":userPassword
	}

	const request = new Request('/accounts/login', {
		method: 'post',
		body: JSON.stringify(body),
		headers: {
			'Content-Type': 'application/json'
		}
	})

	fetch(request).then(function(res) {
		return res.json();
	}).then(function(response){
		if (response.success){
			window.location = '/portal';
		} else if (response.banned){
			$('#bannedModal').modal('toggle');
		} else {
			$('#errorModal').modal('toggle');
		}
	})

}

const signUp = document.querySelector('#signUpButton');
signUp.addEventListener('click', openSignUp);

function openSignUp(){
	$('#signUpModal').modal('toggle');
}

const create = document.querySelector('#createAccount');
create.addEventListener('click', registerNewUser);

function registerNewUser(){
	const givenUsername = document.querySelector('#newUser').value;
	const givenPassword = document.querySelector('#newPassword').value;
	const confirm = document.querySelector('#confirmPassword').value;
	const errorBlock = document.querySelector('#errorBlock');

	const userLength = document.querySelector('#userLength');
	const userTaken = document.querySelector('#userTaken');
	const passLength = document.querySelector('#passLength');
	const passMatch = document.querySelector('#passMatch');
	const errors = [userLength, userTaken, passLength, passMatch];

	if (givenUsername.length < 4 || givenUsername.length > 15){
		errors.forEach( (error) => {
			error.style.display = 'none';
		})
		userLength.style.display = 'inline';
	} else if (givenPassword.length < 4){
		errors.forEach( (error) => {
			error.style.display = 'none';
		})
		passLength.style.display = 'inline';
	} else if (givenPassword !== confirm){
		errors.forEach( (error) => {
			error.style.display = 'none';
		})
		passMatch.style.display = 'inline';
	} else {
		const body = {
			"username":givenUsername,
			"password":givenPassword
		}

		const request = new Request('/accounts', {
			method: 'post',
			redirect:"follow",
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json'
			}
		})

		fetch(request).then(function(res) {
			if (res.ok){
				window.location = '/portal';
			} else {
				errors.forEach( (issue) => {
					issue.style.display = 'none';
				})
				userTaken.style.display = 'inline';
			}
		}).catch(function(error) {
			console.log(error);
		})

	}
}
