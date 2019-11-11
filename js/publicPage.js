'use strict'

$("#signOut").on('click', function (event) { event.preventDefault(); window.location.href = "/accounts/logout"; });
$("#dashboard").on('click', function (event) { event.preventDefault(); window.location.href = "/portal" });

let loggedInAs;
let currentlyViewing;

const getPlans = new Request('/plans/all', {
  method: 'GET'
})

const userDataRequest = new Request('/accounts/userdata', {
  method: 'GET'
})

document.addEventListener('DOMContentLoaded', function () {
  fetch(userDataRequest).then(res => {
    return res.json();
  }).then(response => {
    loggedInAs = response.username;
  })

  fetch(getPlans).then(res => {
    return res.json();
  }).then(response => {
    if (response.plans) {
      const sortedPlans = response.plans.sort((plan1, plan2) => {
        if (plan1.name < plan2.name) {
          return -1;
        } else {
          return 1;
        }
      })
      drawPlansOnPage(sortedPlans);
    }
  })
})

function drawPlansOnPage(plans) {
  const planPanes = document.querySelector('#planPanes');
  plans.forEach(plan => {
    const newPane = document.createElement('div');
    newPane.classList.add("pane", "col-xl-3", "col-md-6", "mb-4");
    const contentHolder = document.createElement('div');
    contentHolder.classList.add("card", "border-0", "shadow");
    const cardBody = document.createElement('div');
    cardBody.classList.add("card-body", "text-center")
    const cardHeader = document.createElement('h5');
    cardHeader.classList.add("card-title", "mb-0");
    cardHeader.appendChild(document.createTextNode(plan.name));
    const cardText = document.createElement('div');
    cardText.classList.add("card-text", "text-black-50");
    cardText.appendChild(document.createTextNode('Made By: ' + plan.madeby));
    cardText.appendChild(document.createElement('br'));
    cardText.appendChild(document.createTextNode('Program: '));
    const programText = document.createElement('span');
    programText.classList.add("shown-by-nameSearch", "shown-by-programSearch");
    programText.appendChild(document.createTextNode(plan.major));
    cardText.appendChild(programText);

    const viewButton = document.createElement('a');
    viewButton.classList.add("btn", "btn-block", "btn-primary", "pane-button");
    viewButton.setAttribute("href", "#");
    viewButton.setAttribute("name", plan._id);
    viewButton.appendChild(document.createTextNode("View Course Map"));
    viewButton.addEventListener('click', openMap);

    const importButton = document.createElement('button');
    importButton.setAttribute('type', 'button');
    importButton.classList.add("btn", "btn-block", "btn-primary", "pane-button");
    importButton.setAttribute("href", "#");
    importButton.setAttribute("name", plan._id);
    importButton.appendChild(document.createTextNode("Import Plan"));
    if (plan.madeby === loggedInAs) {
      importButton.setAttribute("disabled", "disabled");
    } else {
      importButton.addEventListener('click', importPlan);
    }

    const reviewButton = document.createElement('a');
    reviewButton.classList.add("btn", "btn-block", "btn-primary", "pane-button");
    reviewButton.setAttribute("href", "#");
    reviewButton.setAttribute("name", plan._id);
    reviewButton.appendChild(document.createTextNode("Reviews"));
    reviewButton.addEventListener('click', openReviewModal);

    cardBody.appendChild(cardHeader);
    cardBody.appendChild(cardText);
    cardBody.appendChild(viewButton);
    cardBody.appendChild(importButton);
    cardBody.appendChild(reviewButton);
    contentHolder.appendChild(cardBody);
    newPane.appendChild(contentHolder);
    planPanes.appendChild(newPane)
  })
}

function generateBlankGraph() {
  return cytoscape({
    style: [ // the stylesheet for the graph
      {
        selector: 'node',
        css: {
          'label': 'data(course.coursecode)',
          'text-valign': 'center',
          'text-halign': 'center',
          'width': '80',
          'shape': 'round-rectangle'
        }
      }, {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'width': 3,
          'line-color': '#cccccc',
          'target-arrow-color': '#000',
          'target-arrow-shape': 'triangle',
          'target-arrow-fill': 'filled'
        }
      }, {
        selector: '.thickedge',
        style: {
          'curve-style': 'bezier',
          'width': 5,
          'line-color': '#cccccc',
          'target-arrow-color': '#000',
          'target-arrow-shape': 'triangle',
          'target-arrow-fill': 'filled'
        }
      }, {
        selector: ".finished",
        style: {
          'background-color': '#666666',
          'color': '#FFFFFF'
        }

      }, {
        selector: ".inprogress",
        style: {
          'background-color': '#610d0d',
          'color': '#FFFFFF'
        }

      }, {
        selector: ".highlighted",
        style: {
          'background-color': '#333333',
          'color': '#FFFFFF'
        }

      }]
  });
}

function openMap(e) {
  const planId = e.target.name;
  const getPlanGraph = new Request('/plans/graph/' + planId, {
    method: 'GET'
  })

  fetch(getPlanGraph).then(res => {
    return res.json()
  }).then(response => {
    $("#graphModal").modal('toggle');
    console.log(response.graph)
    document.querySelector("#courseMapContainer").innerHTML = '';

    let cy = generateBlankGraph();
    cy.add(response.graph);

    cy.mount(document.querySelector("#courseMapContainer"))

    cy.autoungrabify(true);
    cy.panningEnabled(false);
    cy.zoomingEnabled(false);

    const newHeight = window.innerHeight - 120;
    document.getElementById("courseMapContainer").setAttribute("style", "height:" + newHeight + "px");
    cy.resize();

    for (let i = 1; i < 5; i++) {
      for (let j = 1; j < 4; j++) {
        const row = (i - 1) * 3 + j - 1;
        const padding = 40;

        const coursesInRow = cy.nodes((n) => (n.data('course').year == i) && (n.data('course').semester == j));
        for (let i = 0; i < coursesInRow.length; i++) {
          coursesInRow[i].unlock();
          coursesInRow[i].position('x', (i + 1) * (cy.extent().x2 - cy.extent().x1) / (coursesInRow.length + 1));
          coursesInRow[i].lock();
        }
      }
    }

    cy.on('mouseover', (e) => {
      if (e.target.length > 0) {
        e.target.predecessors().forEach((n) => {
          if (n.group() == "nodes") {
            n.addClass("highlighted")
          } else {
            n.addClass("thickedge")
          }
        })
      }
    })
    cy.on('mouseout', (e) => {
      if (e.target.length > 0) {
        e.target.predecessors().forEach((n) => {
          if (n.group() == "nodes") {
            n.removeClass("highlighted")
          } else {
            n.removeClass("thickedge")
          }
        })
      }
    })

  })
}

function importPlan(e) {
  const body = {
    plan: e.target.name
  }
  const importRequest = new Request('/plans/import', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  })

  fetch(importRequest).then(res => {
    return res.json();
  }).then(response => {
    if (response.success) {
      $('#okModal').modal('toggle');
    }
  })
}

function openReviewModal(e) {
  currentlyViewing = e.target.name;
  $('#seeReviewModal').modal('toggle');

  const reviewsRequest = new Request('/plans/reviews/' + currentlyViewing, {
    method: 'GET'
  })

  fetch(reviewsRequest).then(function (res) {
    return res.json();
  }).then(function (response) {
    const reviews = response.reviews;

    const modalLabel = document.querySelector('#reviewModalLabel');
    modalLabel.innerHTML = '';
    modalLabel.appendChild(document.createTextNode("Reviews for " + response.name + ' by ' + response.maker));

    document.querySelector("#review-spinner").style.display = 'none';
    const reviewList = document.querySelector("#reviewList")
    reviewList.innerHTML = ''

    console.log(reviews)
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

        reviewBox.appendChild(reviewHeader)
        reviewBox.appendChild(document.createTextNode(review.text))

        reviewList.appendChild(reviewBox)
      })
    }
  })
}

document.querySelector("#submitReview").addEventListener("click", (e) => {
  e.preventDefault(); // prevent the default click action from being performed
  if ($(".rating :radio:checked").length == 0) {
    return false;
  } else {
    const rating = $('input:radio[name=rating]:checked').val(); // integer from 1 to 5
    const text = document.querySelector("#reviewText").value;

    const body = {
      rating: rating,
      text: text,
      plan: currentlyViewing
    }

    const submitRequest = new Request('/plans/reviews', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    fetch(submitRequest).then(res => {
      return res.json()
    }).then(response => {
      if (response.success) {
        // reset form
        var ele = document.getElementsByName("rating");
        for (var i = 0; i < ele.length; i++)
          ele[i].checked = false;

        document.querySelector("#reviewText").value = "";
        $('#leaveReviewModal').modal('toggle');
      }
    })
  }
})

document.querySelector("#leaveReview").addEventListener('click', showLeaveReviewModal);
function showLeaveReviewModal() {
  $('#seeReviewModal').modal('toggle');
  $('#leaveReviewModal').modal('toggle');
}

const nameSearch = document.querySelector('#nameSearch');

nameSearch.addEventListener('keyup', function (e) {
  const term = e.target.value.toLowerCase();

  const plans = document.getElementsByClassName("shown-by-programSearch")

  for (let i = 0; i < plans.length; i++) {
    if (plans[i].parentElement.parentElement.children[0].innerText.toLowerCase().indexOf(term) != -1) {
      plans[i].style.display = 'inline';
      plans[i].parentElement.parentElement.parentElement.parentElement.style.display = 'block';
      plans[i].classList.add("shown-by-nameSearch");
    } else {
      plans[i].style.display = 'none';
      plans[i].parentElement.parentElement.parentElement.parentElement.style.display = 'none';
      plans[i].classList.remove("shown-by-nameSearch");
    }
  }
})

const programSearch = document.querySelector('#programSearch');

programSearch.addEventListener('keyup', function (e) {
  const term = e.target.value.toLowerCase();

  const plans = document.getElementsByClassName("shown-by-nameSearch")

  for (let i = 0; i < plans.length; i++) {
    if (plans[i].innerText.toLowerCase().indexOf(term) != -1) {
      plans[i].style.display = 'inline';
      plans[i].parentElement.parentElement.parentElement.parentElement.style.display = 'block';
      plans[i].classList.add("shown-by-programSearch");
    } else {
      plans[i].style.display = 'none';
      plans[i].parentElement.parentElement.parentElement.parentElement.style.display = 'none';
      plans[i].classList.remove("shown-by-programSearch");
    }
  }
})
