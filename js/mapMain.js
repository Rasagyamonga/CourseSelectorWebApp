/*jshint esnext: true, browser: true*/

$("#signOut").on('click', function(event) {event.preventDefault(); window.location.href = "/accounts/logout";});
$("#publicPage").on('click', function(event) {event.preventDefault();window.location.href = "/plans"});
$("#dashboard").on('click', function(event) {event.preventDefault();window.location.href = "/portal"});

let cy = window.cy = generateBlankGraph();

let mapOpenedFor;

document.addEventListener('DOMContentLoaded', drawGraph);
function drawGraph() {
    if (!localStorage.mapViewing){
        window.location.href = "/";
    }
    console.log(localStorage.mapViewing);
    mapOpenedFor = localStorage.mapViewing;
    const body = {
        planId: localStorage.mapViewing
    }

    const getGraph = new Request('/plans/graph', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    })

    fetch(getGraph).then(function (res) {
        return res.json();
    }).then(function (response) {
        if (response.graph) {
            console.log("RETRIEVING GRAPH")
            // RESPONSE.GRAPH is the graph object
            cy = generateBlankGraph();
            cy.add(response.graph);
        } else {
            console.log("GENERATING GRAPH")
            // PLAN HAS NO GRAPH OBJECT, MAKE A NEW ONE
            cy = generateBlankGraph()
            saveCourseMap()
        }
        cy.mount(document.querySelector("#courseMapContainer"))

        cy.on('select', selectCourse);
        cy.on('mouseover', mouseOver)
        cy.on('mouseout', mouseout)
        resize();

        const header = document.querySelector('#titleArea');
        header.appendChild(document.createTextNode(response.name));
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

function resize() {
    cy.autoungrabify(true);
    cy.panningEnabled(false);
    cy.zoomingEnabled(false);

    const newHeight = window.innerHeight - 120;
    document.getElementById("courseMapContainer").setAttribute("style", "height:" + newHeight + "px");
    cy.resize();

    positionNodesInRow()
}

window.onresize = resize;

const searchForm = document.querySelector('.searchBackground');

const courseButton = document.querySelector('#addCourse');
courseButton.addEventListener('click', showSearchForm);

function showSearchForm() {
    console.log("Showing search")
    searchForm.style.display = 'block';
}

window.onclick = function (event) {
    if (event.target == searchForm) {
        searchForm.style.display = 'none';
    }
}

window.onkeydown = function (event) {
    if (searchForm.style.display === 'block' && event.keyCode == 27) {
        searchForm.style.display = 'none';
        console.log('Closed');
    }
}

const closeButton = document.querySelector('#close');
closeButton.addEventListener('click', closeSearchForm);

function closeSearchForm() {
    searchForm.style.display = 'none';
}

const searchButton = document.querySelector('#searchBarBut');
searchButton.addEventListener('click', displayResults);

function displayResults() {
    const courseCode = document.querySelector('#courseIn').value;
    const results = document.querySelector('#searchResults');
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
        for (let i = 0; i < courses.length; i++) {
            let newRadio = document.createElement('input');
            let newLabel = document.createElement('label');

            newRadio.type = 'radio';
            newRadio.classList.add('resultRadio');
            newRadio.id = courses[i]._id;
            newRadio.name = 'courseOption';
            newLabel.htmlFor = courses[i]._id;

            let heading = document.createElement('h3');
            heading.appendChild(document.createTextNode(courses[i].coursecode + ' - ' + courses[i].name));
            newLabel.appendChild(heading);

            newLabel.appendChild(document.createElement('br'));

            let descript = document.createElement('span');
            descript.appendChild(document.createTextNode(courses[i].description));
            newLabel.appendChild(descript);

            console.log(newLabel)

            let prereqs = document.createElement('span');
            prereqs.appendChild(document.createTextNode('Prerequisites: '));
            if (courses[i].prerequisites.length === 0) {
                prereqs.appendChild(document.createTextNode('None'));
            } else {
                for (let and = 0; and < courses[i].prerequisites.length; and++) {
                    for (let or = 0; or < courses[i].prerequisites[and].length; or++) {
                        prereqs.appendChild(document.createTextNode(courses[i].prerequisites[and][or]));
                        if (or !== courses[i].prerequisites[and].length - 1) {
                            prereqs.appendChild(document.createTextNode('/'));
                        }
                    }
                    if (and !== courses[i].prerequisites.length - 1){
                      prereqs.appendChild(document.createTextNode(' ; '));
                    }
                }
            }
            newLabel.appendChild(document.createElement('br'));
            newLabel.appendChild(prereqs);
            newLabel.appendChild(document.createElement('br'));
            newLabel.appendChild(document.createElement('br'));

            console.log(newLabel)
            results.appendChild(newRadio);
            results.appendChild(newLabel);
        }
    })
}

function addPrereqEdges(course) {
    const postreqNodes = cy.nodes((n) => [].concat(...n.data('course').prerequisites).includes(course.coursecode));
    postreqNodes.forEach((n) => cy.add({
        group: 'edges',
        data: {
            id: course.coursecode + '-' + n.id(),
            source: course.coursecode,
            target: n.id()
        }
    }));

    return course.prerequisites.reduce((acc, prereqList) => {
        return acc && prereqList.reduce((acc, prereq) => {
            if (cy.nodes("#" + prereq).length > 0) {
                if (cy.edges("#" + prereq + '-' + course.coursecode).length == 0) {
                    cy.add({
                        group: 'edges',
                        data: {
                            id: prereq + '-' + course.coursecode,
                            source: prereq,
                            target: course.coursecode
                        }
                    });
                }
                return acc
            } else {
                return false;
            }
        }, true)
    }, true)
}

function positionNode(node, course) {
    const row = (course.year - 1) * 3 + course.semester - 1;
    const padding = 40;

    node.position('y', row * (cy.extent().y2 - cy.extent().y1 - padding) / 11 + cy.extent().y1 + padding / 2);

    const coursesInRow = cy.nodes((n) => (n.data('course').year == course.year) && (n.data('course').semester == course.semester));
    for (let i = 0; i < coursesInRow.length; i++) {
        coursesInRow[i].unlock();
        coursesInRow[i].position('x', (i + 1) * (cy.extent().x2 - cy.extent().x1) / (coursesInRow.length + 1));
        coursesInRow[i].lock();
    }
}

function positionNodesInRow() {
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
}

function addCourseToGraph(course) {
    if (cy.nodes("#" + course.coursecode).length > 0) {
        cy.remove("#" + course.coursecode);
    }

    const newNode = cy.add({
        group: 'nodes',
        data: {
            id: course.coursecode,
            course: course
        }
    });
    newNode.addClass('finished')

    positionNode(newNode, course)

    addPrereqEdges(course)

    newNode.lock();

    saveCourseMap()

    return newNode;
}

const addButton = document.querySelector('#addButton');
addButton.addEventListener('click', addCourse);

function addCourse() {
    let course;
    let year = parseInt(document.getElementById('yearIn').value);
    let sem;

    let courseChoices = document.getElementsByName('courseOption');
    for (let i = 0; i < courseChoices.length; i++) {
        if (courseChoices[i].checked) {
            course = courseChoices[i].id;
            break;
        }
    }

    let semChoices = document.getElementsByName('semester');
    for (let c = 0; c < semChoices.length; c++) {
        if (semChoices[c].checked) {
            sem = semChoices[c].value;
        }
    }

    const courseSearchReq = new Request('/courses/' + course, {
        method: 'get'
    })

    fetch(courseSearchReq).then(function (res) {
        return res.json();
    }).then(function (response) {
        let newCourse = response.course;
        newCourse.year = year;
        newCourse.semester = parseInt(sem);
        addCourseToGraph(newCourse);
    })
}

document.querySelector('#removeCourse').addEventListener('click', removeCourseFromGraph);
function removeCourseFromGraph() {
    const courseID = document.querySelector('#courseModalLabel').innerText.split(' - ')[0];
    cy.remove("#" + courseID);

    positionNodesInRow()

    saveCourseMap()

    $('#courseModal').modal('toggle');
}

document.querySelector('#markInProgress').addEventListener('click', toggleInProgress);
function toggleInProgress() {
    const courseID = document.querySelector('#courseModalLabel').innerText.split(' - ')[0];
    const node = cy.nodes("#" + courseID)[0]

    if (node.hasClass("inprogress")) {
        node.removeClass("inprogress")
    } else {
        node.addClass("inprogress")
    }

    saveCourseMap()

    $('#courseModal').modal('toggle');
}


document.querySelector("#showReviews").addEventListener('click', displayReviews);
function displayReviews() {

    const courseID = document.querySelector('#courseModalLabel').innerText.split(' - ')[0];
    $('#courseModal').modal('toggle');

    const course = cy.nodes("#" + courseID).data().course

    const modalLabel = document.querySelector('#reviewModalLabel');
    modalLabel.innerHTML = '';
    modalLabel.appendChild(document.createTextNode("Reviews for " + course.coursecode + ' - ' + course.name));

    const courseSearchReq = new Request('/courses/' + course._id, {
        method: 'get'
    })

    fetch(courseSearchReq).then(function (res) {
        return res.json();
    }).then(function (response) {
        const reviews = response.course.reviews;
        document.querySelector("#review-spinner").style.display = 'none';
        const reviewList = document.querySelector("#reviewList")
        reviewList.innerHTML = ''


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

                reviewList.appendChild(reviewBox)
            })
        }
    })

    $('#reviewModal').modal('toggle');
}

function selectCourse(e) {
    const course = e.target.data().course;
    e.target.unselect();

    document.querySelector("#review-spinner").style.display = 'block';

    const modalLabel = document.querySelector('#courseModalLabel');
    const modalText = document.querySelector('#courseModalText');
    modalLabel.innerHTML = '';
    modalText.innerHTML = '';

    modalLabel.appendChild(document.createTextNode(course.coursecode + ' - ' + course.name));
    modalText.appendChild(document.createTextNode(course.description));

    $('#courseModal').modal('toggle');
}

function mouseOver(e) {
    if (e.target.length > 0) {
        e.target.predecessors().forEach((n) => {
            if (n.group() == "nodes") {
                n.addClass("highlighted")
            } else {
                n.addClass("thickedge")
            }
        })
    }
}

function mouseout(e) {
    if (e.target.length > 0) {
        e.target.predecessors().forEach((n) => {
            if (n.group() == "nodes") {
                n.removeClass("highlighted")
            } else {
                n.removeClass("thickedge")
            }
        })
    }
}

document.querySelector("#submitReview").addEventListener("click", (e) => {
    e.preventDefault(); // prevent the default click action from being performed
    if ($(".rating :radio:checked").length == 0) {
        return false;
    } else {
        const rating = $('input:radio[name=rating]:checked').val(); // integer from 1 to 5
        const text = document.querySelector("#reviewText").value;
        const courseCode = document.querySelector('#courseModalLabel').innerText.split(' - ')[0];

        const body = {
            code: courseCode,
            rating: rating,
            text: text
        }
        // TODO: SEND REVIEW
        const postReview = new Request('/courses/review', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        console.log(body)

        fetch(postReview).then(function (res) {
            return res.json();
        }).then((response) => {
            if (response.success) {
                console.log('review posted')
            } else {
                console.log('post failed')
            }
        })

        // reset form
        var ele = document.getElementsByName("rating");
        for (var i = 0; i < ele.length; i++)
            ele[i].checked = false;

        document.querySelector("#reviewText").value = "";
        $('#courseModal').modal('toggle');
    }
})

function saveCourseMap() {
    const body = {
        plan: mapOpenedFor,
        graph: cy.elements().jsons(cy)
    }

    const updateGraph = new Request('/accounts/plan/map', {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    })

    fetch(updateGraph).then(function (res) {
        return res.json();
    }).then(function (response) {
        if (!response.success) {
            reload();
        }
    })
}
