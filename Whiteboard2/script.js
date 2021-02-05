// get our canvas element
        const canvas = document.getElementById("canvas");
        const context = canvas.getContext("2d");

        // list of all strokes drawn
        const drawings = [];
        const vt = new ViewTools(canvas,context);

function setup()
{
  try
  {
  AddStatus("Entering setup()");
  AddStatus(JSON.stringify(vt));
  singleTouch = false;
  doubleTouch = false;
  dragmv = undefined; // dragging from this moving vector object 
  dragto = undefined;
  // Touch Event Handlers 
  canvas.addEventListener('touchstart', onTouchStart);
  canvas.addEventListener('touchend', onTouchEnd);
  canvas.addEventListener('touchcancel', onTouchEnd);
  canvas.addEventListener('touchmove', onTouchMove);
  PlaneButtonsOff(true);
  AddStatus("Exiting setup()");
  }
  catch(err)
  {
    AddStatus(err);
  }
}

        // disable right clicking
        document.oncontextmenu = function () 
        {
          return false;
        }

        
        function redrawCanvas() {
            // set the canvas to the size of the window
            canvas.width = document.body.clientWidth;
            canvas.height = document.body.clientHeight*.8;
            //canvas.width = document.body.clientWidth;
            //canvas.height = document.body.clientHeight;

            context.fillStyle = '#fff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < drawings.length; i++) 
            {
                const line = drawings[i];
                drawLine(vt.toScreenX(line.x0), vt.toScreenY(line.y0),
                         vt.toScreenX(line.x1), vt.toScreenY(line.y1));
            }
            if (Objs!=undefined)
            {
              for (let mv of Objs)
              {
                mv.Draw(context);
              }
            }
        }
        redrawCanvas();

        // if the window changes size, redraw the canvas
        window.addEventListener("resize", (event) => {
            redrawCanvas();
        });

        function drawLine(x0, y0, x1, y1) {
            context.beginPath();
            context.moveTo(x0, y0);
            context.lineTo(x1, y1);
            context.strokeStyle = '#000';
            context.lineWidth = 1;
            context.stroke();
        }

        // touch functions
        const prevTouches = [null, null]; // up to 2 touches
        let singleTouch = false;
        let doubleTouch = false;
        var dragmv = undefined; // dragging from this moving vector object 
        var dragto = undefined;
        function onTouchStart(event) {
            AddStatus("in Touch Start");
            if (event.touches.length == 1) {
                singleTouch = true;
                doubleTouch = false;
            }
            if (event.touches.length >= 2) {
                singleTouch = false;
                doubleTouch = true;
            }

            // store the last touches
            prevTouches[0] = event.touches[0];
            prevTouches[1] = event.touches[1];

        }
        function onTouchMove(event) {
            // get first touch coordinates
            const touch0X = event.touches[0].pageX;
            const touch0Y = event.touches[0].pageY;
            const prevTouch0X = prevTouches[0].pageX;
            const prevTouch0Y = prevTouches[0].pageY;

            const scaledX = vt.toTrueX(touch0X);
            const scaledY = vt.toTrueY(touch0Y);
            const prevScaledX = vt.toTrueX(prevTouch0X);
            const prevScaledY = vt.toTrueY(prevTouch0Y);

            if (singleTouch) 
            {
              if (get("sketch").checked)
              {
                // add to history
                drawings.push({
                    lbl: "line",
                    x0: prevScaledX,
                    y0: prevScaledY,
                    x1: scaledX,
                    y1: scaledY
                })
                drawLine(prevTouch0X, prevTouch0Y, touch0X, touch0Y);
              }
              else
              {
                if (dragmv==undefined)
                {
                  //AddStatus("Find the closest plane");
                  let tempmv=new MovingVector(1,1,scaledX,scaledY);
                  let closestmv=Objs[0];
                  //AddStatus("checking distance with temp");
                  let dist=DistBetween(tempmv,closestmv);
                  for(let mv of Objs)
                  {
                    //AddStatus("checking distance");
                    let testdist=DistBetween(mv,tempmv);
                    if (testdist<dist)
                    {
                      //AddStatus("found closest="+mv.xpos+","+mv.ypos);
                      dist=testdist;
                      closestmv=mv;
                    }
                  }
                  dragmv=closestmv;
                }
                dragto=[touch0X,touch0Y]
              }
            }

            if (doubleTouch) {
                // get second touch coordinates
                const touch1X = event.touches[1].pageX;
                const touch1Y = event.touches[1].pageY;
                const prevTouch1X = prevTouches[1].pageX;
                const prevTouch1Y = prevTouches[1].pageY;

                // get midpoints
                const midX = (touch0X + touch1X) / 2;
                const midY = (touch0Y + touch1Y) / 2;
                const prevMidX = (prevTouch0X + prevTouch1X) / 2;
                const prevMidY = (prevTouch0Y + prevTouch1Y) / 2;

                // calculate the distances between the touches
                const hypot = Math.sqrt(Math.pow((touch0X - touch1X), 2) + Math.pow((touch0Y - touch1Y), 2));
                const prevHypot = Math.sqrt(Math.pow((prevTouch0X - prevTouch1X), 2) + Math.pow((prevTouch0Y - prevTouch1Y), 2));

                // calculate the screen scale change
                var zoomAmount = hypot / prevHypot;
                vt.scale = vt.scale * zoomAmount;
                get("debug02").innerHTML="Scale="+vt.scale.toFixed(2);
                const scaleAmount = 1 - zoomAmount;

                // calculate how many pixels the midpoints have moved in the x and y direction
                const panX = midX - prevMidX;
                const panY = midY - prevMidY;
                // scale this movement based on the zoom level
                vt.offsetX += (panX / vt.scale);
                vt.offsetY += (panY / vt.scale);

                // Get the relative position of the middle of the zoom.
                // 0, 0 would be top left. 
                // 0, 1 would be top right etc.
                var zoomRatioX = midX / canvas.clientWidth;
                var zoomRatioY = midY / canvas.clientHeight;

                // calculate the amounts zoomed from each edge of the screen
                const unitsZoomedX = vt.trueWidth() * scaleAmount;
                const unitsZoomedY = vt.trueHeight() * scaleAmount;

                const unitsAddLeft = unitsZoomedX * zoomRatioX;
                const unitsAddTop = unitsZoomedY * zoomRatioY;

                vt.offsetX += unitsAddLeft;
                vt.offsetY += unitsAddTop;

                redrawCanvas();
            }
            prevTouches[0] = event.touches[0];
            prevTouches[1] = event.touches[1];
        }
        function onTouchEnd(event) 
        {
          singleTouch = false;
          doubleTouch = false;

          if (Objs.length==0 || dragmv==undefined)return;
          //AddStatus(dragmv.Snapshot());
          let dragVector=new Vector(vt.toTrueX(dragto[0])-dragmv.xpos,
                                    vt.toTrueY(dragto[1])-dragmv.ypos);
          // allow the user to cancel the vector by moving back to the origin
          if (dragVector.GetLength()<(25/vt.scale))
          {
            dragmv=undefined;
            return;
          }
          if (get("radiusturn").checked)
            dragmv.SlewTo(dragVector);
          else
            dragmv.vector.SetDirection(dragVector.GetDirection());
          dragmv=undefined;
        }

function get(id)
{
  return document.getElementById(id);
}

function ClearSketch()
{
  for (let i=drawings.length-1;i>=0;i--)
  {
    if (drawings[i].lbl=="line")
    drawings.pop();
  }
  redrawCanvas();
}

var Objs=[];

function AddPlanes()
{
  let button = get("addplanes");
  switch (button.value)
  {
    case "Add Planes":
    let x = vt.toTrueX(0);
    let ymin = vt.toTrueY(0);
    let ymax = vt.toTrueY(canvas.height);
    button.value="Stop Add";
    var id2 = setInterval(addPlanes, 5000);
    function addPlanes()
    {
      if (button.value!="Stop Add") 
      {
        clearInterval(id2);
        return;
      }
      let rand = ymin+Math.random()*(ymax-ymin);
      let plane={type:"plane",length:15,width:8,color:"black",
               drag:0,gravity:0};
      let movingVector = new MovingVector(.14,0,x,rand,plane,vt);
      Objs.push(movingVector);
    }
    break;

    case "Stop Add":
    button.value="Add Planes";
    break;
  }
}

function AddPlane()
{
  AddStatus("In AddPlane");
  let speed=1;
  let plane={type:"plane",length:15,width:8,color:"black",
               drag:0,gravity:0};
  let movingVector = new MovingVector(.1,.1,0,0,plane,vt);
  //AddStatus(JSON.stringify(movingVector));
  Objs.push(movingVector);
}

function PlaneButtonsOff(truefalse)
{
  get("addplane").disabled=truefalse;
  if (get("addplanes").value=="Stop Add")
    AddPlanes(); // callmit again to stop it
  get("addplanes").disabled=truefalse;
}

function StartAnimation()
{
  if (runAnimate) // running, so stop
  {
    runAnimate=false;
    get("animate").value="Start Animation";
    AddPlanes(true);
    PlaneButtonsOff(true);
  }
  else // not running, so start
  {
    runAnimate=true;
    get("animate").value="Stop Animation";
    drawings.push({lbl:"hanger",x0:0,y0:0,x1:30,y1:0});
    drawings.push({lbl:"hanger",x0:0,y0:0,x1:0,y1:30});
    drawings.push({lbl:"hanger",x0:0,y0:30,x1:30,y1:0});
    Animate();
    PlaneButtonsOff(false);
  }
}

let runAnimate=false;
function Animate()
{
try
  {
  AddStatus("In Animate");
  var id = setInterval(frame, 30);
  function frame() 
  {
    try
    {
    //AddStatus("in Frame");
    if (!runAnimate) 
    {
      clearInterval(id);
      Objs=[];
    } 
    else 
    {
      // world edge is canvas size / zoom
      for (let mv of Objs)
      {
        mv.Move();
      } 
      //AddStatus("Look for collisions with other objects");
      for (let i=0;get("collision").checked &&  i<Objs.length-1;i++)
      {
        for (let j=i+1;j<Objs.length;j++)
        {
          if (DistBetween(Objs[i],Objs[j])<10)
          {
            let v1=Objs[i].vector;
            let v2=Objs[j].vector;
            let movingAway=Objs[i].MovingAway(Objs[j]);
            if (!movingAway)
            {
              CollisionBounce(Objs[i],Objs[j])
              Objs[i].Move();
              Objs[j].Move();
            }
          }
        }
      }
      //AddStatus("Clear, then draw everything");
      redrawCanvas();
      if (dragmv!=undefined)
      {
        drawLine(vt.toScreenX(dragmv.xpos),vt.toScreenY(dragmv.ypos),
                 dragto[0],dragto[1]);
        //AddStatus(dragmv.xpos+","+dragmv.ypos);
      }
      get("debug01").innerHTML=Objs.length+" Objects";
      for (let mv of Objs)
      {
        mv.Draw(context);
      }
    }
    }
    catch(err)
    {
      AddStatus("frame:"+err.message);
    }
  }
  }
  catch(err)
  {
    AddStatus("Animate:"+err.message);
  }
}

function CollisionBounce(mv1,mv2)
{
  /*
  In an elastic collision between spheres, bodies retain their speed in the 
  direction tangent to the collision. they swap speeds in the direction
  normal to the collision point.
  */
  // get the vector between the two center points
  // this will be normal to the collision point
  let normal = new Vector(mv2.xpos-mv1.xpos,mv2.ypos-mv1.ypos);
  // get the tangent vector
  let tangent = normal.UnitNormal();
  //AddStatus("normal\n"+JSON.stringify(normal));
  //AddStatus("tangent\n"+JSON.stringify(tangent));
  //setup mv2
  let projTangent2=mv2.vector.ProjectOn(tangent);
  let otherNormal2=mv1.vector.ProjectOn(normal);
  let newVector2=projTangent2.Add(otherNormal2);

  //AddStatus("normal dir = "+normal.GetDirection());
  //AddStatus("tangent dir = "+tangent.GetDirection());
  //AddStatus("projTangent2 dir = "+projTangent2.GetDirection());
  //AddStatus("otherNormal2 dir = "+otherNormal2.GetDirection());
  //AddStatus("newVector2 dir = "+newVector2.GetDirection());

  // setup mv1
  let projTangent1=mv1.vector.ProjectOn(tangent);
  let OtherNormal1=mv2.vector.ProjectOn(normal);
  let newVector1=projTangent1.Add(OtherNormal1);

  mv1.vector=newVector1;
  mv2.vector=newVector2; 
}

function DistBetween(mv1,mv2)
{
  let dist = Math.hypot(mv2.xpos-mv1.xpos,mv2.ypos-mv1.ypos); 
  //AddStatus("mv1/mv2=["+mv1.xpos+","+mv1.ypos+"]["+mv2.xpos+","+mv2.ypos+"]");
  return dist;
}