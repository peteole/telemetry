//document.getElementById("ah").style.width="10px";
"usestrict";


var grid;
var speedDisplay;
var altitudeDisplay;
var artificialHorizon;
var compass;
var map;
var bank = 0;
var webSocket;
var instruments = [];
var heights = [];
var widths = [];
var displays = [document.createElement("div")];
var devices = [];
var planeParameters = [];
var movers=[document.createElement("div")];
var heads = [];
var currentHead = null;
var deviceSelector;
var transferStatus = 0;
var framerate = 10;
var columns;
var time=0;
var lat=0;
var lon=0;
var position = 0;
var binaryData;
var resizerButton;
var lastXPos=49.943347;
var lastYPos= 8.347979;
onresize = setWindowSizes;
planeParameters[0] = function () {
    var b = new Float32Array(binaryData.slice(position, position + 4))[0];
    artificialHorizon.setPitch(b);
    position += 4;
}
planeParameters[1] = function () {
    var b = new Float32Array(binaryData.slice(position, position + 4))[0];
    artificialHorizon.setBank(b);
    position += 4;
}
planeParameters[2] = function () {
    var b = new Float32Array(binaryData.slice(position, position + 4))[0];
    compass.value=b*180/3.1415;
    position += 4;
}
planeParameters[3] = function () {
    var b = new Float32Array(binaryData.slice(position, position + 4))[0];
    altitudeDisplay.value=b;
    position += 4;
}
planeParameters[4] = function () {
    var b = new Float32Array(binaryData.slice(position, position + 4))[0];
    speedDisplay.value=b;
    position += 4;
}
planeParameters[5] = function () {
    var b = new Uint32Array(binaryData.slice(position, position + 4))[0];
    time=b;
    writeToConsole("Zeit: "+time);
    position += 4;
}
planeParameters[6] = function () {
    var b = new Float32Array(binaryData.slice(position, position + 4))[0];
    lat=b;
    position += 4;
}
planeParameters[7] = function () {
    var b = new Float32Array(binaryData.slice(position, position + 4))[0];
    lon=b;
    if(lon!=0&&lastXPos!=0){
        map.drawLine(lastXPos,lastYPos,lat,lon);
        lastXPos=lat;
        lastYPos=lon;
    }
    position += 4;
}
onclose = function () {
    webSocket.close();
}
onload = function () {
    grid = this.document.getElementById("grid");
    if (this.window.innerHeight < this.window.innerWidth) {
        /*grid.style.gridTemplateRows=this.window.innerHeight*0.7+"px "+ this.window.innerHeight*0.3+"px";
        var ahHeight=this.window.innerHeight*0.7;
        var rest=(this.window.innerWidth-ahHeight)/2+"px "
        grid.style.gridTemplateColumns=rest+ ahHeight+"px " +rest;*/
        columns = 3;
    } else {
        /*grid.style.gridTemplateColumns=this.window.innerWidth*0.97+"px";
        grid.style.gridTemplateRows="100px "+this.window.innerWidth*0.97+"px 100px 100px 10px 10px";*/
        columns = 1;
    }
    displays[0] = this.document.getElementById("settings");
    displays[1] = this.document.getElementById("pfd");
    displays[2] = this.document.getElementById("map");
    displays[3] = this.document.getElementById("flightData");
    displays[4] = this.document.getElementById("grapher");
    displays[5] = this.document.getElementById("console");
    document.getElementById("wssInput").value=window.location.hostname+":8081";
    for (var i = 0; false && i < displays.length; i++) {
        displays[i].draggable = true;
        displays[i].ondragover = function (event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move"
        };
        displays[i].ondrop = function (event) {
            console.log("dropped");
            // Get the id of the target and add the moved element to the target's DOM
            var data = event.dataTransfer.getData("application/my-app");
            var b = event.target;
            while (b != document && !displays.includes(b)) {
                b = b.parentElement;
            }
            if (b.id != data && b != document) {
                event.preventDefault();
                console.log("verschoben");
                var a = document.getElementById(data);
                if (!a || a.className != "default") {
                    return;
                }
                var bufferRS = a.style.gridRowStart;
                var bufferCS = a.style.gridColumnStart;
                var bufferRE = a.style.gridRowEnd;
                var bufferCE = a.style.gridColumnEnd;
                a.style.gridRowStart = b.style.gridRowStart;
                a.style.gridColumnStart = b.style.gridColumnStart;
                a.style.gridRowEnd = b.style.gridRowEnd;
                a.style.gridColumnEnd = b.style.gridColumnEnd;

                b.style.gridRowStart = bufferRS;
                b.style.gridColumnStart = bufferCS;
                b.style.gridRowEnd = bufferRE;
                b.style.gridColumnEnd = bufferCE;
                setWindowSizes();
            }
            //ev.target.appendChild(document.getElementById(data));
        };
        displays[i].ondragstart = function (event) {
            event.dataTransfer.setData("application/my-app", event.target.id);
            event.dataTransfer.dropEffect = "move";
        };
    }
    deviceSelector = document.getElementById("deviceSelector");
    deviceSelector.onchange = setDevice;
    speedDisplay = new ValueDrawer(this.document.getElementById("speedDisplay"), false, 30, 10);
    altitudeDisplay = new ValueDrawer(this.document.getElementById("altitudeDisplay"), false, 10, 10);
    artificialHorizon = new ArtificialHorizon(this.document.getElementById("artificialHorizon"));
    compass = new ValueDrawer(this.document.getElementById("compass"), true, 60, 6);
    resizerButton = document.getElementById("resizer");
    setGridSizes();
    map = new MapGraphic(this.document.getElementById("map"));
    //map.addMapPart();
    map.addMapPart(new MapPart("demomap.png", 49.943347, 8.164838, 50.029121-49.943347, 8.347979-8.164838));
    //map.drawLine(0, 0, -1, 1);
    //artificialHorizon.draw();
    //speedDisplay.draw();
    //animateBank();
    window.requestAnimationFrame(drawInstruments);
    makeMovers();
    //makeMoversVisible();
    //var oldX=displays[0].clientLeft;
    //var oldY=displays[0].clientTop;
    /*SwipeElementItem.savePosition(displays[0]);
    displays[0].style.gridColumn="2";
    SwipeElementItem.slideElement(displays[0]);*/
}
function makeMovers(){
    movers=[];
    for(var i=0;i<displays.length;i++){
        movers[i]=document.createElement("div");
        movers[i].setAttribute("class","mover");
        /*movers[i].style.height="50px";
        movers[i].style.width="50px";
        movers[i].style.zIndex="3";
        movers[i].style.backgroundColor="red";
        movers[i].style.position="absolute";
        movers[i].style.left="50%";*/
    }
}
var moverItems=[];
function makeMoversVisible(){
    var button=document.getElementById("mover");
    button.innerHTML="stop moving";
    button.onclick=makeMoversInvisible;
    moverItems=[];
    for(var i in movers){
        displays[i].prepend(movers[i]);
        moverItems[i]=new SwipeElementItem(movers[i]);
        moverItems[i].display=displays[i];
        //var b=displays[i];
        moverItems[i].onMoveStart=function(sc){
            grid.style.touchAction = "none";
            for(var el of displays){
                el.style.filter="blur(5px)";
            }
            this.display.style.filter="none";
            this.display.style.zIndex=10;
        }
        moverItems[i].onMove=function(sei){
            SwipeElementItem.moveElement(sei.currentX,sei.currentY,this.display);
            SwipeElementItem.moveElement(-20,0,this.swipeElement);
        }.bind(moverItems[i]);
        moverItems[i].onMoveEnd=function(sc,mousePosition){
            grid.style.touchAction="default";
            for(var el of displays){
                el.style.filter="none";
                el.style.zIndex="0";
            }
            for(var i in moverItems){
                moverItems[i].swipeElement.style.zIndex="10";
            }
            //this.display.style.zIndex="0";
            var below=document.elementsFromPoint(mousePosition.x,mousePosition.y);
            var targetDisplay=null;
            for(var el of below){
                if(displays.includes(el)&&el!=this.display){
                    targetDisplay=el;
                }
            }
            if(targetDisplay==null){
                return;
            }
            var a=this.display;
            var b=targetDisplay;

            var bufferRS = a.style.gridRowStart;
            var bufferCS = a.style.gridColumnStart;
            var bufferRE = a.style.gridRowEnd;
            var bufferCE = a.style.gridColumnEnd;
            a.style.gridRowStart = b.style.gridRowStart;
            a.style.gridColumnStart = b.style.gridColumnStart;
            a.style.gridRowEnd = b.style.gridRowEnd;
            a.style.gridColumnEnd = b.style.gridColumnEnd;

            b.style.gridRowStart = bufferRS;
            b.style.gridColumnStart = bufferCS;
            b.style.gridRowEnd = bufferRE;
            b.style.gridColumnEnd = bufferCE;
            for(var el of displays){
                SwipeElementItem.moveElement(0,0,el);
            }
            for(el of moverItems){
                this.lastControlXRest=0;
                this.lastControlYRest=0;
            }
            setWindowSizes();
        }
    }
}
function makeMoversInvisible(){
    var button=document.getElementById("mover");
    button.innerHTML="start moving";
    button.onclick=makeMoversVisible;
    for(var i in displays){
        displays[i].removeChild(movers[i]);
    }
}
function addColumn() {
    hideResizer();
    columns++;
    setGridSizes();
}
function deleteColumn() {
    hideResizer();
    if (columns < 2) {
        return;
    }
    columns--;
    setGridSizes();
}

function setWindowSizes() {
    with (artificialHorizon.canvas) {
        style.height = parentElement.clientHeight * 0.9 + "px";
        style.width = parentElement.clientWidth * 0.9 + "px";
        style.marginLeft = parentElement.clientWidth * 0.05 + "px";
    }
    artificialHorizon.resize();
    with (speedDisplay.canvas) {
        style.height = parentElement.clientHeight + "px";
        style.width = parentElement.clientWidth / 20 + "px";
    }
    speedDisplay.resize();
    with (altitudeDisplay.canvas) {
        style.height = parentElement.clientHeight + "px";
        style.width = parentElement.clientWidth / 20 + "px";
        style.marginLeft = parentElement.clientWidth * 0.95 + "px";
    }
    altitudeDisplay.resize();
    with (compass.canvas) {
        style.height = parentElement.clientHeight / 10 + "px";
        style.width = parentElement.clientWidth * 0.9 + "px";
        style.marginLeft = parentElement.clientWidth * 0.05 + "px";
        style.marginTop = parentElement.clientHeight * 0.9 + "px";
    }
    compass.resize();
    //drawAH();
}
var finishedDrawing=true;
function drawInstruments() {
    finishedDrawing=false;
    //console.log("drawing finianimation frame");
    instruments.forEach(function (element) { element.draw() });
    finishedDrawing=true;
    //setTimeout(drawInstruments, 1000 / framerate);
    window.requestAnimationFrame(drawInstruments);

}
function animateBank() {
    //drawAH(10,bank);
    bank += 0.2;
    //artificialHorizon.draw();
    artificialHorizon.setBank(bank);
    speedDisplay.value += 0.03;
    //speedDisplay.draw();
    setTimeout(animateBank, 10);
}
function connect() {
    webSocket = new WebSocket("ws://" + document.getElementById("wssInput").value, "ws");
    webSocket.binaryType = "arraybuffer";
    webSocket.onerror = function (event) {
        console.error("Fehler: ", event);
        disconnect();
    }
    webSocket.onopen = function (event) {
        writeToConsole("connection established");
        document.getElementById("connectionIndicator").value = "disconnect";
    };
    webSocket.onmessage = function (event) {
        if (event.data == "fd") {
            //writeToConsole("new flight data package incoming");
            transferStatus = "fd";
        } else if (event.data == "headDefinition") {
            transferStatus = "headDefinition";
        } else if (transferStatus == "deviceList") {
            var list = JSON.parse(event.data);
            deviceSelector.options.length = list.length;
            for (var i = 0; i < list.length; i++) {
                deviceSelector.options[i].label = list[i];
                deviceSelector.options[i].value = list[i];
            }
            setDevice();
        } else if (event.data == "deviceList") {
            transferStatus = "deviceList";
        } else if (transferStatus == "fd") {
            if(!finishedDrawing){
                writeToConsole("too fast!!!");
                finishedDrawing=true;
                return;
            }
            finishedDrawing=false;
            binaryData = event.data;
            position = 1;
            //writeToConsole("data recieved: "+Date.now());
            //console.log("data recieved: "+Date.now());
            var headNumber=new Uint8Array(event.data.slice(0, 1))[0];
            currentHead = heads[headNumber];
            if(event.data.byteLength!=21&&headNumber==2){
                return;
            }
            if(headNumber==3){
                headNumber=3;
            }
            for (var headPosition = 0; headPosition < currentHead.length; headPosition++) {
                planeParameters[currentHead[headPosition]]();
            }
            if (position != event.data.byteLength) {
                writeToConsole("uebertragungsfehler");
            }
            artificialHorizon.draw();
            finishedDrawing=true;
            //console.log("finishedDrawing!!!");
        } else if (transferStatus == "headDefinition") {
            heads[new Uint8Array(event.data.slice(0, 1))[0]] = new Uint8Array(event.data.slice(1));
        }
    };
    webSocket.onclose = disconnect;
    document.getElementById("connector").value = "";
}
function disconnect() {
    //alert("geschlossen");
    currentHead = null;
    writeToConsole("connection closed");
    document.getElementById("connectionIndicator").value = "";
    document.getElementById("connector").value = "connect to server";
    heads=[];
    deviceSelector.options.length=0;
}
function setDevice() {
    webSocket.send("selectDevice " + deviceSelector.options.selectedIndex);
    console.log("device:" + deviceSelector.value.label);

}
function refresh() {
    webSocket.send("requestDeviceList");
    //transferStatus=2;
    //deviceSelector.options.length++;
    //deviceSelector.options[deviceSelector.options.length-1].label=deviceSelector.options.length;
}
class MapGraphic {
    constructor(canvasBase) {
        var canvas=document.createElement("div");
        canvas.style.position="absolute";
        canvas.style.width="100%"
        canvas.style.height="100%"
        canvas.style.overflow="auto"
        canvasBase.appendChild(canvas);
        this.minX = Infinity;
        this.maxX = -Infinity;
        this.minY = Infinity;
        this.maxY = -Infinity;
        this.canvas = canvas;
        this.overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.overlay.setAttribute("class", "map");
        this.overlay.style.overflow = "visible";
        this.overlay.style.zIndex = "1";
        //this.overlay.setAttribute("viewBox","0 0 100 100");
        //this.overlay.style.height="100px";
        //this.overlay.style.width="100px";
        //this.overlay.setAttribute("height",this.backgroundImage.style.height*0+200+"px");
        //this.overlay.setAttribute("width",this.backgroundImage.style.width*0+200+"px");
        canvas.appendChild(this.overlay);
        this.canvas=canvas;
        this.images = [];
        this.zoomFactor = 10000;
        var zoomIn=document.createElement("button");
        zoomIn.style.position="absolute";
        zoomIn.style.left="50px";
        zoomIn.innerHTML="+";
        zoomIn.onclick=function(){
            var oldX=this.canvas.scrollLeft;
            var oldY=this.canvas.scrollTop;
            this.zoomFactor*=2;
            this.fitMaps();
            this.canvas.scrollTo(oldX*2,oldY*2);
        }.bind(this);
        zoomIn.style.zIndex=4;
        canvasBase.appendChild(zoomIn);
        var zoomOut=document.createElement("button");
        zoomOut.style.position="absolute";
        zoomOut.style.left="100px";
        zoomOut.innerHTML="-";
        zoomOut.onclick=function(){
            var oldX=this.canvas.scrollLeft;
            var oldY=this.canvas.scrollTop;
            this.zoomFactor/=2;
            this.fitMaps();
            this.canvas.scrollTo(oldX/2,oldY/2);
        }.bind(this);
        zoomOut.style.zIndex=4;
        canvasBase.appendChild(zoomOut);
    }
    addMapPart(p = new MapPart("demomap.png", 1, 4, 5, 8)) {
        this.images.push(p);
        var change = false;
        if (p.x < this.minX) {
            this.minX = p.x;
            change = true;
        }
        if (p.y < this.minY) {
            this.minY = p.y;
            change = true;
        }
        if (p.y + p.h > this.maxY) {
            this.maxY = p.y + p.h;
            //change=true;
        }
        if (p.x + p.w > this.maxX) {
            this.maxX = p.x + p.w;
            //change=true;
        }
        if (change) {
            this.fitMaps();
        } else {
            p.backgroundImage.style.left = (p.x - this.minX) * this.zoomFactor + "px";
            p.backgroundImage.style.top = (p.y - this.minY) * this.zoomFactor + "px";
        }
        p.backgroundImage.style.height = p.h * this.zoomFactor + "px";
        p.backgroundImage.style.width = p.w * this.zoomFactor + "px";
        /*var backgroundImage=document.createElement("img");
        backgroundImage.setAttribute("src",backgroundImagePath);
        backgroundImage.setAttribute("class","map");
        this.canvas.appendChild(backgroundImage);*/
        this.canvas.appendChild(p.backgroundImage);
    }
    fitMaps() {
        for (var img of this.images) {
            img.backgroundImage.style.left = (img.x - this.minX) * this.zoomFactor + "px";
            img.backgroundImage.style.top = (img.y - this.minY) * this.zoomFactor + "px";
            img.backgroundImage.style.height = img.h * this.zoomFactor + "px";
            img.backgroundImage.style.width = img.w * this.zoomFactor + "px";
        }
        this.overlay.setAttribute("viewBox", "0 0 1 1");
        this.overlay.style.top = -this.minY * this.zoomFactor + "px";
        this.overlay.style.left = -this.minX * this.zoomFactor + "px";
        this.overlay.style.height = this.zoomFactor + "px";
    }
    drawLine(x1, y1, x2, y2, color = "black") {
        if (this.minX > x1 || this.minX > x2) {
            this.minX = Math.min(x1, x2);
        }
        if (this.maxX < x1 || this.maxX < x2) {
            this.maxX = Math.max(x1, x2);
        }
        if (this.minY > y1 || this.minY > y2) {
            this.minY = Math.min(y1, y2);
        }
        if (this.maxY < y1 || this.minY < y2) {
            this.maxY = Math.max(y1, y2);
        }
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", 0.5/this.zoomFactor);
        this.overlay.appendChild(line);
        this.fitMaps();
    }
    xConv(x = 0) {
        return (x - this.minX) * this.zoomFactor;
    }
    yConv(y = 0) {
        return (y - this.minY) * this.zoomFactor;
    }
}
class MapPart {
    constructor(backgroundImagePath, x, y, w, h) {
        this.backgroundImage = document.createElement("img");
        this.backgroundImage.setAttribute("src", backgroundImagePath);
        this.backgroundImage.setAttribute("class", "map");
        this.x = x;
        this.y = y;
        this.h = h;
        this.w = w;
    }
}
class Instrument {
    constructor(canvas) {
        this.canvas = canvas;
        this.canvasDrawer = canvas.getContext("2d");
        this.resize();
        this.draw();
        instruments.length++;
        instruments[instruments.length - 1] = this;
        this.minArea=200*50
    }
    resize() {        
        this.height = this.canvas.clientHeight;
        this.width = this.canvas.clientWidth;
        var area=this.width*this.height;
        var factor=area/this.minArea;
        if(factor<1){
            this.height/=factor;
            this.width/=factor;
            writeToConsole("zu klein");
        }
        this.canvas.height = this.height;
        this.canvas.width = this.width;
    }
    draw() {
        alert("hii");
    }
}
class ArtificialHorizon extends Instrument {
    constructor(canvas) {
        super(canvas);
        this.horizonImage = document.getElementById("artificialHorizonImage");
        this.pitch = 10;
        this.radBank = 0;
        this.bank = 0;
        this.onePitchDegree = 0;
        this.bigLine = 0;
        this.smallLine = 0;
        this.maxPitchValue = 0;
        this.canvas.style.backgroundColor = "blue";
        this.minArea=400*400;
    }
    setPitch(pitchRad){
        /*while(pitchRad>Math.PI){
            pitchRad-=Math.PI
        }
        while(pitchRad<-Math.PI){
            pitchRad+=Math.PI;
        }*/
        this.pitch=pitchRad*180/Math.PI;
    }
    setBank(bankRad) {
        this.bank = bankRad*180/Math.PI;
        this.radBank = bankRad;
    }
    resize() {
        super.resize();
 

        this.canvasDrawer.translate(this.width / 2, this.height / 2);
        this.onePitchDegree = this.height / 60;
        this.bigLine = this.width / 20;
        this.smallLine = this.width / 100;
        this.maxPitchValue = 0.6 * Math.sqrt(this.height * this.height + this.width * this.width);
    }
    draw() {
        this.canvasDrawer.setTransform(1, 0, 0, 1, 0, 0);
        this.canvasDrawer.clearRect(0, 0, this.width, this.height);
        this.canvasDrawer.translate(this.width / 2, this.height / 2);


        this.canvasDrawer.rotate(-this.radBank);
        this.canvasDrawer.fillStyle = "brown";
        this.canvasDrawer.fillRect(-this.maxPitchValue, this.onePitchDegree * this.pitch, this.maxPitchValue * 2, this.maxPitchValue*2);
        this.canvasDrawer.strokeStyle = "#FFFFFF";
        var i = 0;
        for (var y = this.onePitchDegree * this.pitch; y < this.maxPitchValue; y += this.onePitchDegree) {
            this.canvasDrawer.beginPath();
            if (i % 10 == 0) {
                this.canvasDrawer.moveTo(-this.bigLine, y);
                this.canvasDrawer.lineTo(this.bigLine, y);
            } else {
                this.canvasDrawer.moveTo(-this.smallLine, y);
                this.canvasDrawer.lineTo(this.smallLine, y);
            }
            this.canvasDrawer.stroke();
            i++;
        }
        i = 0;
        for (var y = this.onePitchDegree * this.pitch; y > -this.maxPitchValue; y -= this.onePitchDegree) {
            this.canvasDrawer.beginPath();
            if (i % 10 == 0) {
                this.canvasDrawer.moveTo(-this.bigLine, y);
                this.canvasDrawer.lineTo(this.bigLine, y);
            } else {
                this.canvasDrawer.moveTo(-this.smallLine, y);
                this.canvasDrawer.lineTo(this.smallLine, y);
            }
            this.canvasDrawer.stroke();
            i++;
        }


        this.canvasDrawer.setTransform(1, 0, 0, 1, 0, 0);
        this.canvasDrawer.translate(this.width / 2, this.height / 2);
        this.canvasDrawer.strokeStyle="black";
        this.canvasDrawer.beginPath();
        this.canvasDrawer.moveTo(-0.4*this.width,0);
        this.canvasDrawer.lineTo(-0.1*this.width,0);
        this.canvasDrawer.lineTo(-0.1*this.width,this.height/20);
        this.canvasDrawer.stroke();
        this.canvasDrawer.beginPath();
        this.canvasDrawer.moveTo(0.4*this.width,0);
        this.canvasDrawer.lineTo(0.1*this.width,0);
        this.canvasDrawer.lineTo(0.1*this.width,this.height/20);
        this.canvasDrawer.stroke();
    }
}
class ValueDrawer extends Instrument {
    constructor(canvas, horizonal = false, valueRange = 100, numOfValues = 10) {
        super(canvas);
        this.horizonal = horizonal;
        this.value = 0;
        this.valueRange = valueRange;
        this.numOfValues = numOfValues;
        if(horizonal){
            this.minArea*=2;
        }
        this.canvasDrawer.translate(this.height / 2, this.width / 2);
    }
    resize() {
        super.resize();
        this.canvasDrawer.setTransform(1, 0, 0, 1, 0, 0);
        this.canvasDrawer.translate(this.width / 2, this.height / 2);

    }
    draw() {
        var minValueToDraw = this.value - this.valueRange / 2;
        minValueToDraw -= minValueToDraw % (this.valueRange / this.numOfValues);
        var maxValueToDraw = minValueToDraw + this.valueRange;
        var step = this.valueRange / this.numOfValues;
        this.canvasDrawer.clearRect(-this.width / 2, -this.height / 2, this.width, this.height);
        this.canvasDrawer.strokeStyle = "#FFFFFF";
        if (this.horizonal) {
            for (var value = minValueToDraw; value <= maxValueToDraw; value += step) {
                var coordinate = this.valueToX(value);
                this.canvasDrawer.beginPath();
                this.canvasDrawer.moveTo(coordinate, 0);
                this.canvasDrawer.lineTo(coordinate, -this.height / 2);
                this.canvasDrawer.stroke();
                this.canvasDrawer.strokeText(value, coordinate, 0);
            }
        } else {
            for (var value = minValueToDraw; value <= maxValueToDraw; value += step) {
                var coordinate = this.valueToY(value);
                this.canvasDrawer.beginPath();
                this.canvasDrawer.moveTo(0, coordinate);
                this.canvasDrawer.lineTo(-this.width / 2, coordinate);
                this.canvasDrawer.stroke();
                this.canvasDrawer.strokeText(value, 0, coordinate);
            }
        }
    }
    valueToY(value) {
        return -(value - this.value) * this.height / this.valueRange;
    }
    valueToX(value) {
        return -(value - this.value) * this.width / this.valueRange;
    }
}
function writeToConsole(text) {
    var para = document.createElement("p");
    para.appendChild(document.createTextNode(text));
    var console = document.getElementById("consoleOutput");
    console.appendChild(para);
    while(console.childElementCount>100){
        console.removeChild(console.firstChild);
    }
    console.scrollTo(0, console.scrollHeight);
}
function resetDisplays() {
    //columns=3;
    for (var i = displays.length - 1; i >= 0; i--) {
        selectDisplay(i);
    }
    setWindowSizes();
}
function selectDisplay(a) {
    /*var row=1;
    if(a>2){
        row=2;
    }*/
    row = Math.floor(a / columns) + 1;
    //var column=1+(a%3);
    column = 1 + a % columns;
    //grid.setValue(displays[a],row,column);
    displays[a].style.gridColumnStart = column;
    displays[a].style.gridColumnEnd = column;
    displays[a].style.gridRowStart = row;
    displays[a].style.gridRowEnd = row;
}
function enter() {
    alert("key pressed");
}
function setGridSizes() {
    var height = this.window.innerHeight;
    var width = this.window.innerWidth;
    var c = "";
    widths = new Array(columns);
    for (var i = 0; i < columns; i++) {
        widths[i] = (i + 1) * width / columns;
        c += width / columns + "px ";
    }
    grid.style.gridTemplateColumns = c;
    c = "";
    var rows = Math.ceil(displays.length / columns);
    heights = new Array(rows);
    for (var i = 0; i < rows; i++) {
        heights[i] = (i + 1) * height / rows;
        c += height / rows + "px ";
    }
    grid.style.gridTemplateRows = c;
    resetDisplays();
}
function updateFramerate() {
    framerate = document.getElementById("framerateSetter").value;
}

var swipeXItems = [];
var swipeYItems = [];
function resizeGridInitiator() {
    grid.style.touchAction = "none";
    swipeXItems = [];
    swipeYItems = [];
    resizerButton.onclick = hideResizer;
    resizerButton.value = "stop resizing grid";
    heights = grid.style.gridTemplateRows.split("px");
    widths = grid.style.gridTemplateColumns.split("px");
    var last = 0;
    for (var i = 0; i < heights.length - 1; i++) {
        heights[i]++;
        heights[i]--;
        var resizer = document.createElement("div");
        resizer.setAttribute("class", "resizerH");
        resizer.style.top = heights[i] + last - 5 + "px";
        last += heights[i];
        resizer.yIndex = i;
        grid.insertBefore(resizer, grid.childNodes[0] || null);
        swipeYItems[i] = new SwipeElementItem(resizer);
        swipeYItems[i].pointToMove = function (point = new Point(0, 0)) {
            return new Point(0, point.y);
        }
        swipeYItems[i].onMoveStart = function (swipeControler) {
            grid.style.touchAction = "none";
        }
        swipeYItems[i].onMoveEnd = function (swipeControler) {
            var yChange = swipeControler.currentY;
            heights[swipeControler.swipeElement.yIndex] += yChange;
            var sum = 0;
            for (var i in heights) {
                sum += heights[i];
            }
            grid.style.height = sum + "px";
            var c = "";
            for (var i = 0; i < heights.length - 1; i++) {
                c += heights[i] + "px ";
            }
            grid.style.gridTemplateRows = c;
            setWindowSizes();
            hideResizer();
            resizeGridInitiator();
            //grid.style.touchAction="auto";
        }
    }
    last = 0;
    for (var i = 0; i < widths.length - 1; i++) {
        widths[i]++;
        widths[i]--;
        var resizer = document.createElement("div");
        resizer.setAttribute("class", "resizerW");
        resizer.style.left = widths[i] - 5 + last + "px";
        last += widths[i];
        resizer.xIndex = i;
        grid.insertBefore(resizer, grid.childNodes[0] || null);
        swipeXItems[i] = new SwipeElementItem(resizer);
        swipeXItems[i].pointToMove = function (point = new Point(0, 0)) {
            return new Point(point.x);
        }
        swipeXItems[i].onMoveStart = function (swipeControler) {
            grid.style.touchAction = "none";
        }
        swipeXItems[i].onMoveEnd = function (swipeControler) {
            var xChange = swipeControler.currentX;
            widths[swipeControler.swipeElement.xIndex] += xChange;
            var sum = 0;
            for (var i in widths) {
                sum += widths[i];
            }
            grid.style.width = sum + "px";
            var c = "";
            for (var i = 0; i < widths.length - 1; i++) {
                c += widths[i] + "px ";
            }
            grid.style.gridTemplateColumns = c;
            setWindowSizes();
            hideResizer();
            resizeGridInitiator();
            //grid.style.touchAction="auto";
        }
    }
}
function hideResizer() {
    resizerButton.onclick = resizeGridInitiator;
    resizerButton.value = "resize grid";
    try {
        swipeXItems.forEach(function (el) {
            grid.removeChild(el.swipeElement);
        });
        swipeYItems.forEach(function (el) {
            grid.removeChild(el.swipeElement);
        });

    } catch (error) {

    }
    grid.style.touchAction="auto";
}