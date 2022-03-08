//import {floodFill} from "./floodfill.js";

// const { off } = require("process");

/**
 * global variables
 */

let currentMode = "line"; // 'select', 'line', 'rect', 'ellipse'
let divs = []; // global variable to keep track of lists of divs
let selectedDiv = null; //shortcut global variable for which div is selected
let isMoving = false; // whether or not an object is being dragged
var shapePos; // how far in svg space the mouse is from the page
var transform; // how far in svg space a shape is from the page
var origX, origY;

/**
 * DOM element references
 */
let canvasRadioButton = document.querySelector("#radio-show-canvas");
let svgRadioButton = document.querySelector("#radio-show-svg");
let bothRadioButton = document.querySelector("#radio-show-both");
let modesSelection = document.querySelector("#modes-selection");
let borderColorSelection = document.querySelector("#border-color-selection");
let borderWidthRange = document.querySelector("#borderWidthRange");
let borderWidthValue = document.querySelector("#borderWidthValue");
let fillColorSelection = document.querySelector("#fill-color-selection");

let canvas = document.querySelector("#workspace-canvas");
let context = canvas.getContext("2d");
let svg = document.querySelector("#workspace-svg");

const getBorderColor = () => {
  return borderColorSelection.querySelector(".active .color-block").style
    .backgroundColor;
};

const getBorderWidth = () => {
  return parseInt(borderWidthValue.innerText, 10);
};

const getFillColor = () => {
  return fillColorSelection.querySelector(".active .color-block").style
    .backgroundColor;
};



/**
 * init
 */

// mode
document
  .querySelector("#modes-selection .mode#mode-line")
  .classList.add("active");
modesSelection.querySelectorAll(".mode").forEach((mode) => {
  mode.onclick = (event) => {
    modesSelection
      .querySelectorAll(".mode")
      .forEach((md) => md.classList.remove("active"));
    mode.classList.add("active");
    currentMode = mode.id.replace("mode-", "");
    if (currentMode != "select") {
      deselect()
    }
    canvasDrawingMode = new canvasDrawingModes[currentMode]();
    svgEventHandler = svgEventHandlers[currentMode];
  };
});

modesSelection.querySelectorAll(".mode div").forEach((item) => {
  item.style.borderColor = getBorderColor();
  item.style.backgroundColor = getFillColor();
});

// layers
canvasRadioButton.checked = false;
svgRadioButton.checked = true;
bothRadioButton.checked = false;
greyOutDelete();
//modesSelection.classList.add("disabled"); // now starts off enabled

canvasRadioButton.onclick = () => {
  canvasRadioButton.checked = true;
  svgRadioButton.checked = false;
  bothRadioButton.checked = false;
  svg.style.display = "none";
  canvas.style.display = "block";
  tempCanvas.style.display = "block";
  modesSelection.classList.remove("disabled");
  borderColorSelection.classList.remove("disabled");
  fillColorSelection.classList.remove("disabled");
  borderWidthRange.disabled = false;
  deselect();
};

svgRadioButton.onclick = () => {
  canvasRadioButton.checked = false;
  svgRadioButton.checked = true;
  bothRadioButton.checked = false;
  svg.style.display = "block";
  canvas.style.display = "none";
  tempCanvas.style.display = "none";
  modesSelection.classList.remove("disabled");
  borderColorSelection.classList.remove("disabled");
  fillColorSelection.classList.remove("disabled");
  borderWidthRange.disabled = false;
};

bothRadioButton.onclick = () => {
  canvasRadioButton.checked = false;
  svgRadioButton.checked = false;
  bothRadioButton.checked = true;
  svg.style.display = "block";
  canvas.style.display = "block";
  tempCanvas.style.display = "block";
  modesSelection.classList.add("disabled");
  borderColorSelection.classList.add("disabled");
  fillColorSelection.classList.add("disabled");
  borderWidthRange.disabled = true;
  deselect(); // if we go to a new type of workspace, nothing should be selected on entry
};


//this function disables the delete button and is called when nothing should be selected
// (always called on deselect())
function greyOutDelete() {
  document.getElementsByTagName("button")[0].disabled = true
}

// border color
borderColorSelection.querySelectorAll(".mode").forEach((mode) => {
  // svg images do not use border color, they use the attribute "stroke"
  var newColor = null;  // store the color we are inputting so we can change the svg image's stroke color
  mode.onclick = (event) => {
    if (
      mode.querySelector(".color-block").style.backgroundColor ===
        "transparent" &&
      fillColorSelection.querySelector(".mode.active .color-block").style
        .backgroundColor === "transparent"
    ) {
      return;
    }
    borderColorSelection
      .querySelectorAll(".mode")
      .forEach((md) => md.classList.remove("active"));
    mode.classList.add("active");
    modesSelection.querySelectorAll(".mode div").forEach((item) => {
      item.style.borderColor = mode.querySelector(
        ".color-block"
      ).style.backgroundColor;
      newColor = item.style.borderColor // where we get the new color
    });
    getdivs() // get the possible shapes on the screen
    for (var div of divs) { // go through each possible div
      if (div.getAttribute("filter") == `url(#${shadowFilterId})`) { // if the div's filter matches the parameters of being selected,
          div.setAttribute("stroke", newColor); // then give that div only the new stroke color 
      }
    }
  };
});

// border width
const defaultBorderWidth = 3; // what is stored in the span value
borderWidthRange.value = defaultBorderWidth; // default is 3
borderWidthValue.innerText = defaultBorderWidth;
borderWidthRange.oninput = (event) => {
  document.getElementById("borderWidthValue").innerHTML = event.target.value; // moves the slider itself to show different numbers
  getdivs() // get the possible shapes on the screen
  for (var div of divs) { // go through all the shapes
    if (div.getAttribute("filter") == `url(#${shadowFilterId})`) { // if the div's filter matches the parameters of being selected,
      div.setAttribute("stroke-width", event.target.value); // then give that div only the new stroke width (svg shapes use the attribute "stroke-width" not border)
    }
  }
};

// fill color
fillColorSelection.querySelectorAll(".mode").forEach((mode) => {
  // svg images do not use background color, they use the attribute "fill"
  var newColor = null; // store place for the new color
  mode.onclick = (event) => {
    if (
      mode.querySelector(".color-block").style.backgroundColor ===
        "transparent" &&
      borderColorSelection.querySelector(".mode.active .color-block").style
        .backgroundColor === "transparent"
    ) {
      return;
    }
    fillColorSelection
      .querySelectorAll(".mode")
      .forEach((md) => md.classList.remove("active"));
    mode.classList.add("active");
    modesSelection.querySelectorAll(".mode div").forEach((item) => {
      item.style.backgroundColor = mode.querySelector(
        ".color-block"
      ).style.backgroundColor;
      newColor = item.style.backgroundColor // where we get the new color
    });
    getdivs() // get the possible shapes on the screen
    for (var div of divs) {  // go through each possible div
      if (div.getAttribute("filter") == `url(#${shadowFilterId})`) { // if the div's filter matches the parameters of being selected,
          div.setAttribute("fill", newColor); // then give that div only the new fill color 
      }
    }
  };
});

// delete
const deleteOne = () => {
  // can only delete svg layer elements
  document.querySelectorAll("#workspace-svg > *").forEach((node) => {
    if (node.hasAttribute("filter")) {
      node.parentNode.removeChild(node);
      greyOutDelete(); // since the selected object is deleted, nothing is selected
    }
  });
};

// delete all
const deleteAll = () => {
  // if (canvasRadioButton.checked === true || bothRadioButton.checked === true) {
    tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
  // }
  // if (svgRadioButton.checked === true || bothRadioButton.checked === true) {
    getdivs(); //get all possible divs
    for (var div of divs) { //go through divs
      div.remove(); // remove paths
        }
  //  }
};

/**
 *
 *
 *
 * canvas drawing
 */

// adding temp canvas
let tempCanvas = document.createElement("canvas");
tempCanvas.id = "workspace-canvas-temp";
tempCanvas.width = canvas.width;
tempCanvas.height = canvas.height;
canvas.parentNode.insertBefore(tempCanvas, canvas);

let tempContext = tempCanvas.getContext("2d");

const finalizeDrawings = () => {
  // context.drawImage(tempCanvas, 0, 0);
  // tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
  tempContext.drawImage(canvas, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
};


// this function makes sure all shapes have their filter attribute removed, so none of them look selected
function deselect() {
  Array.from(svg.getElementsByTagName("*")).forEach((element) => { // get the array of elements inside the svg workspace
    element.removeAttribute("filter"); //removed the attribute filter, which makes it look selected (removed whether or not the shape had the filter to begin with)
  });
  selectedDiv = null; // global variable used to find which div is selected is nullified
  greyOutDelete() // if nothing is selected, then the delete (for just one shape) should not be available
}



const canvasDrawingModes = {
  // select
  select: function () {
    // does nothing
    this.click = (event) => floodFill(event, tempCanvas, getFillColor());
  },
  // line
  line: function () {
    this.drawing = false;

    this.mousedown = (event) => {
      this.drawing = true;
      context.strokeStyle = getBorderColor();
      context.lineWidth = getBorderWidth();
      this.x0 = event.offsetX;
      this.y0 = event.offsetY;
    };

    this.mousemove = (event) => {
      if (!this.drawing) return;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.beginPath();
      context.moveTo(this.x0, this.y0);
      context.lineTo(event.offsetX, event.offsetY);
      context.stroke();
      context.closePath();
    };

    this.mouseup = (event) => {
      if (this.drawing) {
        this.mousemove(event);
        this.drawing = false;
        finalizeDrawings();
      }
    };
  },
  // rectangle
  rect: function () {
    this.drawing = false;

    this.mousedown = (event) => {
      this.drawing = true;
      context.strokeStyle = getBorderColor();
      context.fillStyle = getFillColor();
      context.lineWidth = getBorderWidth();
      this.left0 = event.offsetX;
      this.top0 = event.offsetY;
    };

    this.mousemove = (event) => {
      if (!this.drawing) return;

      let left = Math.min(this.left0, event.offsetX);
      let top = Math.min(this.top0, event.offsetY);
      let width = Math.abs(event.offsetX - this.left0);
      let height = Math.abs(event.offsetY - this.top0);

      context.clearRect(0, 0, canvas.width, canvas.height);

      context.beginPath();
      context.rect(left, top, width, height);
      context.stroke();
      context.fill();
    };

    this.mouseup = (event) => {
      if (this.drawing) {
        this.mousemove(event);
        this.drawing = false;
        finalizeDrawings();
      }
    };
  },
  // ellipse
  ellipse: function () {
    this.drawing = false;

    this.mousedown = (event) => {
      this.drawing = true;
      context.strokeStyle = getBorderColor();
      context.fillStyle = getFillColor();
      context.lineWidth = getBorderWidth();
      this.left0 = event.offsetX;
      this.top0 = event.offsetY;
    };

    this.mousemove = (event) => {
      if (!this.drawing) return;

      let left = Math.min(this.left0, event.offsetX);
      let top = Math.min(this.top0, event.offsetY);
      let width = Math.abs(event.offsetX - this.left0);
      let height = Math.abs(event.offsetY - this.top0);

      context.clearRect(0, 0, canvas.width, canvas.height);

      let centerX = left + width / 2;
      let centerY = top + height / 2;

      context.beginPath();
      context.ellipse(
        centerX,
        centerY,
        width / 2,
        height / 2,
        0,
        0,
        2 * Math.PI
      );
      context.stroke();
      context.fill();
    };

    this.mouseup = (event) => {
      if (this.drawing) {
        this.mousemove(event);
        this.drawing = false;
        finalizeDrawings();
      }
    };
  },
};

let canvasDrawingMode = new canvasDrawingModes[currentMode]();

const canvasEventHandler = (event) => {
  let mode = canvasDrawingMode[event.type];
  if (mode) {
    mode(event);
  }
};

// no need to detach these event handlers since the canvas layer is behind the svg layer
canvas.addEventListener("mousedown", canvasEventHandler, false);
canvas.addEventListener("mousemove", canvasEventHandler, false);
canvas.addEventListener("mouseup", canvasEventHandler, false);
canvas.addEventListener("click", canvasEventHandler, false);

/**
 *
 *
 *
 * svg drawing
 */
const shadowFilterId = "selected-shadow";

svg.insertAdjacentHTML(
  "afterbegin",
  `
  <filter id="${shadowFilterId}" x="-100%" y="-100%" width="300%" height="300%">
      <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="rgba(0, 0, 0, 0.7)"/>
  </filter>
`
);

const svgPoint = (svgEl, x, y) => {
  let point = svg.createSVGPoint();
  point.x = x;
  point.y = y;
  return point.matrixTransform(svgEl.getScreenCTM().inverse());
};

const svgEventHandlers = {
  // select
  select: function (event) {
    if (
      event.target.nodeName === "line" ||
      event.target.nodeName === "rect" ||
      event.target.nodeName === "ellipse"
    ) {
      deselect() // before we select, let's deselect everything to make sure no 2 values both look selected
      event.target.setAttribute("filter", `url(#${shadowFilterId})`); // give the div we want the filter attribute to look selected
      document.getElementsByTagName("button")[0].disabled = false; // when something gets selected, the delete button (for just one shape) should become available

      // TODO: sync style
      let currFill = event.target.getAttribute("fill");
      let currBorder = event.target.getAttribute("stroke");
      let currWidth = event.target.getAttribute("stroke-width");
      currWidth = currWidth.substring(0, currWidth.length - 2);

      if (event.target.nodeName !== "line") {
        Array.from(fillColorSelection.children).forEach((element) => {
          element.classList.remove("active");
          let fillElem = element.children[0];
          if (fillElem.style.backgroundColor === currFill) element.classList.add("active");
        });
      }

      Array.from(borderColorSelection.children).forEach((element) => {
        element.classList.remove("active");
        let borderElem = element.children[0];
        if (borderElem.style.backgroundColor === currBorder) element.classList.add("active");
      });

      borderWidthRange.value = currWidth;
      borderWidthValue.innerText = currWidth;

      modesSelection.querySelectorAll(".mode div").forEach((item) => {
        item.style.borderColor = getBorderColor();
        item.style.backgroundColor = getFillColor();
      });
    }
    else {
      deselect()
    }
  },
  // line
  line: (event) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const start = svgPoint(svg, event.clientX, event.clientY);
    let borderColor = getBorderColor();
    let borderWidth = getBorderWidth();

    const draw = (e) => {
      let p = svgPoint(svg, e.clientX, e.clientY);

      line.setAttributeNS(null, "x1", start.x);
      line.setAttributeNS(null, "y1", start.y);
      line.setAttributeNS(null, "x2", p.x);
      line.setAttributeNS(null, "y2", p.y);
      line.setAttributeNS(null, "stroke", borderColor);
      line.setAttributeNS(null, "stroke-width", `${borderWidth}px`);
      svg.appendChild(line);
    };

    const endDraw = (e) => {
      svg.removeEventListener("mousemove", draw);
      svg.removeEventListener("mouseup", endDraw);
    };

    svg.addEventListener("mousemove", draw);
    svg.addEventListener("mouseup", endDraw);
  },
  // rect
  rect: (event) => {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const start = svgPoint(svg, event.clientX, event.clientY);
    let borderColor = getBorderColor();
    let borderWidth = getBorderWidth();
    let fillColor = getFillColor();

    const draw = (e) => {
      let p = svgPoint(svg, e.clientX, e.clientY);
      let x = Math.min(p.x, start.x);
      let y = Math.min(p.y, start.y);
      let w = Math.abs(p.x - start.x);
      let h = Math.abs(p.y - start.y);

      rect.setAttributeNS(null, "x", x);
      rect.setAttributeNS(null, "y", y);
      rect.setAttributeNS(null, "width", w);
      rect.setAttributeNS(null, "height", h);
      rect.setAttributeNS(null, "fill", fillColor);
      rect.setAttributeNS(null, "stroke", borderColor);
      rect.setAttributeNS(null, "stroke-width", `${borderWidth}px`);
      svg.appendChild(rect);
    };

    const endDraw = (e) => {
      svg.removeEventListener("mousemove", draw);
      svg.removeEventListener("mouseup", endDraw);
    };

    svg.addEventListener("mousemove", draw);
    svg.addEventListener("mouseup", endDraw);
  },
  // ellipse
  ellipse: (event) => {
    const ellipse = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "ellipse"
    );
    const start = svgPoint(svg, event.clientX, event.clientY);
    let borderColor = getBorderColor();
    let borderWidth = getBorderWidth();
    let fillColor = getFillColor();

    const draw = (e) => {
      let p = svgPoint(svg, e.clientX, e.clientY);
      let x = Math.min(p.x, start.x);
      let y = Math.min(p.y, start.y);
      let w = Math.abs(p.x - start.x);
      let h = Math.abs(p.y - start.y);

      ellipse.setAttributeNS(null, "cx", x + w / 2);
      ellipse.setAttributeNS(null, "cy", y + h / 2);
      ellipse.setAttributeNS(null, "rx", w / 2);
      ellipse.setAttributeNS(null, "ry", h / 2);
      ellipse.setAttributeNS(null, "fill", fillColor);
      ellipse.setAttributeNS(null, "stroke", borderColor);
      ellipse.setAttributeNS(null, "stroke-width", `${borderWidth}px`);
      svg.appendChild(ellipse);
      // getdivs("ellipse");
    };

    const endDraw = (e) => {
      svg.removeEventListener("mousemove", draw);
      svg.removeEventListener("mouseup", endDraw);
    };

    svg.addEventListener("mousemove", draw);
    svg.addEventListener("mouseup", endDraw);
  },
};

let svgEventHandler = svgEventHandlers[currentMode];

svg.addEventListener(
  "mousedown",
  (event) => {
    if (svgRadioButton.checked === true) {
      svgEventHandler(event);
    }
  },
  false
);

// this function gets all the shapes and adds ids to each shape
// ids are named by "shape-{number of that part particular shape}" 
function getdivs() {
  types = ["line", "rect", "ellipse"]; // possible shapes to loop through
  idx = 0; // counter
  for (var type of types) { // go through each type
    for (var div of svg.getElementsByTagName(type)) { // go through each div per shape
        div.id = type + "-" + (idx + 1); // assign id naming system to id
        divs.push(div); // add to greater divs array
        idx++; // increment counter
    }
  idx = 0; // reset counter for new shape
}
}

// this function finds the difference between the offset of the screen and the mouse
// we need the mouse coordinates in svg space
function getMousePosition(event) {
  var CTM = svg.getScreenCTM(); // svg screen offset by default (current transform matrix)
  return {
    x: (event.clientX - CTM.e) / CTM.a, // x for matrix around mouse
    y: (event.clientY - CTM.f) / CTM.d  // y for matrix around mouse
  };
}


function getOffset(element) {
    var bound = element.getBoundingClientRect();
    var html = document.documentElement;

    return {
        top: bound.top + window.pageYOffset - html.clientTop,
        left: bound.left + window.pageXOffset - html.clientLeft
    };
}

let offset;
let translation;

// this starts the dragging feature
svg.addEventListener("mousedown", (event) => {
  getdivs(); // get all the divs so we are able to select the correct one later
  for (var div of divs) { // for each of the possible shapes
    if (event.target == div) { // if the one we are pressing on is the div in our loop
      offset = getOffset(event.target);
      if (event.target.id[0] == "e") {
      // origX = Number(event.target.getAttributeNS(null, "cx"));
      // origY = Number(event.target.getAttributeNS(null, "cy"));
      // origX = Number(event.target.setAttributeNS(null, "transform", "translate(0, 0)"));
      origY = 1
      origX = 1
      console.log(origX)
      // console.log(typeof offset.top, typeof event.target.getAttributeNS(null, "cx"), typeof event.target.getAttributeNS(null, "cy"));
      }
      if (event.target.id[0] == "r") {
        origX = Number(event.target.getAttributeNS(null, "x"));
        origY = Number(event.target.getAttributeNS(null, "y"));
      }
      selectedDiv = div.id // set shortcut for the current div's id
      if (currentMode ==  "select") { // movement should only happen in select mode
        isMoving = true; // set the boolean that dragging is happening
        target = document.getElementById(selectedDiv); // hold onto our div
        shapePos = getMousePosition(event); // get the shapePos for svg
        if (selectedDiv[0] == "r") { // if the id starts with an "r" it is a rectangle
          shapePos.x -= parseFloat(target.getAttributeNS(null, "x")); // calculate new location of shape's x from mouse's original position
          shapePos.y -= parseFloat(target.getAttributeNS(null, "y")); // calculate new location of shape's y from mouse's original position
          }
        else { // if it starts with anything else, transform has to be calculated in a new way ("l" ==  line, "e" == "ellipse")
            var transforms = target.transform.baseVal; // Get all the transforms currently on this element
            if (transforms.length === 0 || transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) { // only translatable transforms are calculable
              var translate = svg.createSVGTransform(); // Create a transform and store var for how far we are going to translate
              translate.setTranslate(0, 0); //start transform at (0, 0)
              target.transform.baseVal.insertItemBefore(translate, 0); // put this new transform at the beginning of list
            }
            transform = transforms.getItem(0); // Get initial translation amount from first transform in list
            shapePos.x -= transform.matrix.e; // subtract this transform from mouse to set x
            shapePos.y -= transform.matrix.f; // subtract this transform from mouse to set y
            if (event.target.id[0] != "r") {
            origX = transform.matrix.e
            origY = transform.matrix.f
            }
        }
      }
    }
  }
})

// this function actually makes the shape follow the mouse while down
svg.addEventListener("mousemove", (event) => {
  if (selectedDiv != null && isMoving) { // if the selectedDiv holds an id, and we have established that we are in drag mode
    var attrX = null // different shapes use different attributes for their coordinates (x)
    var attrY = null // (y)
    if (selectedDiv[0] == "r") { //rectangle directly uses x and y (other shapes not used, but difference is important)
      attrX = "x"; // what x coordinate called
      attrY = "y"; // what y coordinate called
    }
    event.preventDefault(); // we do not want screen to move
    target = document.getElementById(selectedDiv); // get div we want to follow mouse
    if (selectedDiv[0] != "r") { // if it is a rectangle
      var mousePos = getMousePosition(event); // get where mouse is in svg space
      transform.setTranslate(mousePos.x - shapePos.x, mousePos.y - shapePos.y); // set new x and y by subtracting mouse position from shape's current position
    } 
    else { // if it is a line or ellipse
      var mousePos = getMousePosition(event); // get where mouse is in svg space
      target.setAttributeNS(null, attrX, mousePos.x - shapePos.x); // new x positions
      target.setAttributeNS(null, attrY, mousePos.y - shapePos.y); // new y positions
    }
  }
})

// this function ends the dragging function
svg.addEventListener("mouseup", (event) => {
  isMoving = false; // dragging mode ends
  // just because mouse came up does not mean we were in dragging mode
  // we could have only selected
  if (selectedDiv != null) {
    // document.getElementById(selectedDiv).setAttributeNS(null, "cx", 100);
    // document.getElementById(selectedDiv).setAttributeNS(null, "cy", 100);
    
    
    

 
  console.log(getOffset(document.getElementById(selectedDiv)), parseFloat(document.getElementById(selectedDiv).getAttributeNS(null, "cx")), parseFloat(document.getElementById(selectedDiv).getAttributeNS(null, "cy")))

  }
})


document.addEventListener('keyup', (event) => {
  if (isMoving && event.key === 'Escape') {
    if (selectedDiv != null) {
      if (selectedDiv != null && selectedDiv[0] == "r") {
        document.getElementById(selectedDiv).setAttributeNS(null, "x", 1);
        document.getElementById(selectedDiv).setAttributeNS(null, "y", 1);
        document.getElementById(selectedDiv).setAttributeNS(null, "x", origX);
        document.getElementById(selectedDiv).setAttributeNS(null, "y", origY);
        selectedDiv = null;
        isMoving = false;
      }
      if (selectedDiv != null && selectedDiv[0] != "r") {
        document.getElementById(selectedDiv).setAttribute("transform", `translate(${0},${0})`);
        document.getElementById(selectedDiv).setAttribute("transform", `translate(${origX},${origY})`);
        selectedDiv = null;
        isMoving = false;
      }
    }
  }
});