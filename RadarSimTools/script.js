class StateMachine
{
  constructor(name)
  {
    this.name = name;
    this.states=[];
    this.transitions=[];
  }
  AddState(name,callback)
  {
    this.states.push({name:name,cb:callback});
    if (this.states.length==1)this.currentState=name;
    //AddStatus("states:"+JSON.stringify(this.states));
  }
  // assert is used to indicate whether the event is on or off.
  // for example, lets say the event is "alarm", assert true would be
  // used when the alarm transitioned to on. assert false when the 
  // alarm is cleared
  AddTransition(eventName,assert,fromStateName,toStateName)
  {
    this.transitions.push(
      {event:eventName,assert:assert,
       fromState:fromStateName,toState:toStateName});
  }
  Event(name,assert)
  {
    //AddStatus(JSON.stringify(this));
    let filtered=this.transitions.filter(x=>
                      x.event==name && x.assert==assert &&
                      x.fromState==this.currentState);
    //AddStatus("filtered="+JSON.stringify(filtered));
    if (filtered.length>0)
    {
      this.currentState=filtered[0].toState;
      let state = this.states.filter(x=>x.name==this.currentState);
      //AddStatus("newState="+JSON.stringify(state));
      if (state.length>0)
        state[0].cb();
    }
  }
}

/*
keeps and manages a list of holds
*/
class HoldManager
{
  constructor()
  {
    this.holdList=[];
  }
  // hold = {id:aircraftID,x:#,y:#}
  // where x,y = hold entry to south turn
  Request(x,y,aircraftID)
  {
    for (let h of this.holdList)
    {
      let dist = Math.hypot(h.x-x,h.y-y);
      AddStatus("hold dist="+dist.toFixed(1));
    }
    let found = this.holdList.filter(h=>Math.hypot(h.x-x,h.y-y)<100);
    // add the requested hold, and return a hold if there already
    // a plane holding there.
    this.holdList.push({id:aircraftID,x:x,y:y});
    if (found.length>0)
    {
      AddStatus("hold exists");
      return found[0];
    }
    AddStatus("no hold found");
    return undefined;
  }
  Remove(aircraftID)
  {
    for (let i=0;i<this.holdList.length;i++)
    {
      AddStatus("remove hold search "+aircraftID+" "+this.holdList[i].id);
      if (this.holdList[i].id==aircraftID)
      {
        this.holdList.splice(i,1);
        return true;
      }
    }
    return false;
  }
}

class ViewTools
{
  constructor(canvas,context,frameInterval=30)
  {
    this.canvas=canvas;
    this.ctx=context;

    // distance from origin
    this.offsetX = 0;
    this.offsetY = 0;

    // zoom amount
    this.scale = 1;

    // save the frame interval in ms
    this.fi=frameInterval;
    this.vs=2000;
  }
  FrameIntervalInSeconds()
  {
    return Number(this.fi/1000);
  }
  // convert coordinates
  toScreenX(xTrue)
  {
    return (xTrue + this.offsetX) * this.scale;
  }
  toScreenY(yTrue) 
  {
    return (yTrue + this.offsetY) * this.scale;
  }
  toTrueX(xScreen) 
  {
    return (xScreen / this.scale) - this.offsetX;
  }
  toTrueY(yScreen) 
  {
    return (yScreen / this.scale) - this.offsetY;
  }
  trueHeight() 
  {
    return this.canvas.clientHeight / this.scale;
  }
  trueWidth() 
  {
    return this.canvas.clientWidth / this.scale;
  }
}
        


/*************************************************************
**************************************************************
                         MvSpeed(movingVector,framerate)

Description

Parameters

Return Value

*************************************************************/ 
function MvSpeed(movingVector,frameRate,pixelsPerMile)
{
  //AddStatus("in MvSpeed");
  // pixels/frame
  let vlenPerFrame = movingVector.vector.GetLength();
  // miles/frame = pixels/frame / pixels/mile
  let milesPerFrame = vlenPerFrame/pixelsPerMile;
  // miles/s = miles/frame / s/frame
  let milesPerS = milesPerFrame/frameRate;
  let ret = milesPerS*3600;
  return ret;
}
/*************************************************************
**************************************************************
                         VectorLength

Description

Parameters

Return Value

*************************************************************/ 
function VectorLength(targetMPH,frameInterval,pixelsPerMile)
{
  // mi/hr / s/hr = mi/s
  let targetMPS = targetMPH/3600;
  // mi/s * s/frame = mi/frame
  let targetMPF = targetMPS * frameInterval;
  // mi/frame * px/mi = px/frame
  let ret = targetMPF * pixelsPerMile;
  return ret;
}

/*************************************************************
**************************************************************
                         Quicky Functions

Description

Parameters

Return Value

*************************************************************/ 
const ToDegrees = radians => (radians * 180) / Math.PI;
const ToRadians = degrees => (degrees * Math.PI) / 180;

const EPSILON = 0.00000001;
const AreEqual = (one, other, epsilon = EPSILON) =>
  Math.abs(one - other) < epsilon;

const FixHeading = heading => heading%360<0?360+heading%360:heading%360;
/*************************************************************
**************************************************************
FunctionName: get

Description
returns a reference to the HTML element with an id of id

Parameters
id: the id of the element to return

Return Value
reference to the specified HTML element
*************************************************************/ 
function get(id)
{
  return document.getElementById(id);
}

/*************************************************************
**************************************************************
FunctionName: AddStatus

Description
Appends a string to an HTML element with an id of "status"
Should be a textarea. Normally used to display debug info
when debugMode is set to true. debugMode=false can be overridden
by setting alwaysShow to true

Parameters
str: the string to add to the status element
alwaysShow: set true to always add str independent of debugMode

Return Value
none
*************************************************************/ 
var debugMode=true;
function AddStatus(str,alwaysShow=false)
{
  if (str==undefined)str="";
  if (debugMode || alwaysShow)
    get("status").value += "\n"+str;
}

/*************************************************************
**************************************************************
                       class Vector

Description

Parameters

Return Value

*************************************************************/ 
class Vector
{
  constructor(x,y)
  {
    this.x=x;
    this.y=y;
    this.toRadian=Math.PI/180;
  }
  //functions that modify this vector
  
  ScaleMe(multiplier)
  {
    this.x*=multiplier;
    this.y*=multiplier;
  }

  SetLength(len)
  {
    let mult = len/this.GetLength();
    this.x*=mult;
    this.y*=mult;
  }
  RotateMe(degrees)
  {
    //AddStatus("Entering RotateMe("+degrees+")");
    let cd = this.GetDirection();
    //AddStatus("current direction="+cd);
    let len = this.GetLength();
    //AddStatus("current length="+len)
    let radiandir = (cd+degrees)*this.toRadian;
    //AddStatus("radiandir="+radiandir);
    this.x=len*Math.cos(radiandir);
    this.y=len*Math.sin(radiandir);
    //AddStatus("new x,y="+this.x+","+this.y);
  }
  Negate()
  {
    this.x*=-1;
    this.y*=-1;
  }
  SetDirection(direction)
  {
    let dir=direction%360;
    if (dir<0)dir+=360;
    let len=Math.hypot(this.x,this.y);
    this.x=len*Math.cos(dir*this.toRadian);
    this.y=len*Math.sin(dir*this.toRadian);
  }

  //functions that return a Vector object
  ScaleBy(scaleFactor)
  {
    let scaled=new Vector(this.x*scaleFactor,this.y*scaleFactor);
    return scaled;
  }
  ProjectOn(other)
  {
    const unit = other.Unit()
    return unit.ScaleBy(this.Dot(unit))
  }
  Add(v)
  {
    return(new Vector(this.x+v.x,this.y+v.y));
  }

  Unit()
  {
    return new Vector(this.x,this.y).ScaleBy(1/this.GetLength());
  }

  Rotate(degrees)
  {
    let retVector=new Vector(this.x,this.y);
    let thisdir = this.GetDirection();
    let newdir = thisdir+degrees;
    retVector.SetDirection(newdir);
    return retVector;
  }

  UnitNormal()
  {
    let unit=this.Unit();
    unit.SetDirection(unit.GetDirection()+90);
    return unit;
  }

  //functions that return scalar results
  GetDirection()
  {
    //AddStatus("Entering GetDirection");
    let x=this.x;
    if(x==0)x=.00000000001;
    let dir=(Math.atan(this.y/x))/this.toRadian;
    //AddStatus(dir);
    if (x<0)dir+=180;
    if (x>0 && this.y<0)dir+=360;
    //AddStatus(dir);
    return dir;
  }
  Dot(other)
  {
    return other.x * this.x + other.y * this.y;
  }

  GetLength()
  {
    //return Math.sqrt(Math.pow(this.x,2)+Math.pow(this.y,2))
    return Math.hypot(this.x,this.y);
  }

  /*
  if this=0deg and other=20deg, returns 20
  if this=20deg and other=0deg, returns -20 
  */
  AngleBetween(other) 
  {
    let between=(other.GetDirection()-this.GetDirection());
    if (between<0)between+=360;
    if (between>180)between=between-360;
    //AddStatus("between="+between);
    return between;
  }
  
  // Functions that return boolean
  IsSameDirection(other,epsilon=EPSILON) 
  {
    const dotProduct = this.Unit().Dot(other.Unit())
    //get("debug05").innerHTML=dotProduct;
    return AreEqual(dotProduct, 1, epsilon)
  }

  IsOppositeDirection(other) 
  {
    const dotProduct = this.Unit().Dot(other.Unit())
    return AreEqual(dotProduct, -1)
  }

  IsPerpendicularTo(other) 
  {
    const dotProduct = this.Unit().Dot(other.Unit())
    return AreEqual(dotProduct, 0)
  }

  IsEqual(other)
  {
    return AreEqual(this.x,other.x) && AreEqual(this.y,other.y);
  }
}

/*************************************************************
**************************************************************
                       class MovingVector

Description

Parameters

Return Value

*************************************************************/ 
const circleObj={type:"circle",radius:15,color:"black",drag:0,gravity:0};
const squareObj={type:"square",sidelen:15,color:"black",drag:0,gravity:0,id:0};
const planeObj={type:"plane",length:20,width:15,color:"black",drag:0,gravity:0};
class MovingVector
{
  constructor(xlen,ylen,startx,starty,drawObject=circleObj,
              view=null,altitude=15000,tag="none")
  {
    this.vector= new Vector(xlen,ylen);
    this.xpos=startx;
    this.ypos=starty;
    this.drawObject=drawObject;
    this.turnTargetDirection=this.turnDeltaAngle=0;
    this.vt=view;
    this.tag=tag;
    this.breadCrumbs=[];
    this.alt=altitude;
    this.targetAlt=altitude;
    this.colorid=null; // blink color interval id
    this.color="black"
    this.colors=["black"]; // default
    this.targetSpeed=undefined;
    this.deltaSpeed=.5;
    this.hp=new HoldPattern(0,0,this);
    this.radial=undefined;
    this.shortestTurn=0;
    this.leftTurn=1;
    this.rightTurn=2;
  }
  Stats()
  {
    let headingTargetStr="";
    if (this.turnDeltaAngle!=0)
    {
      let headingTarget=Math.round(FixHeading(this.turnTargetDirection+90));
      headingTargetStr=">"+headingTarget;
    }
    let altTargetStr="";
    if (this.alt!=this.targetAlt)
    {
      altTargetStr=">"+Math.round(this.targetAlt/100);
    }
    let speedTargetStr="";
    if (this.targetSpeed!=undefined)
    {
       speedTargetStr=">"+this.targetSpeed;
    }
    return "Hdg:"+this.GetHeading()+headingTargetStr+
           " "+(MvSpeed(this,this.vt.fi/1000,10)).toFixed(0)+
                "kts"+speedTargetStr+
            " FL"+(this.alt/100).toFixed(0)+altTargetStr;
  }
  Snapshot()
  {
    let ret="MovingVector Snapshot\n"+
    "vector: "+JSON.stringify(this.vector)+"\n"+
    "World x,y: "+this.xpos.toFixed(2)+","+this.ypos.toFixed(2)+"\n"+
    "DrawObj: "+JSON.stringify(this.drawObject)+"\n"+
    "View: "+JSON.stringify(this.view);
    return ret;
  }
  FlyRadialFromCurrentPosition(target)
  {
    if (target==undefined)
      return;
    let radial = new Vector(target[0]-this.xpos,
                            target[1]-this.ypos);
    this.SlewTo(radial,this.shortestTurn);
    this.radial = new FlyRadial(radial,{x:target[0],y:target[1]},this);
  }
  Hold(target)
  {
    if (target!=undefined)
    {
      // 2*speedInMph/60 or a 2min turn
      //let diamMiles = this.GetSpeed()/(30*Math.PI); 
      //let diam = 10*diamMiles; // 10 is pixels/mi 
      let diam = this.Diam2MinPix();
      //AddStatus("diam="+diam);
      // find the center of the turn in
      let targetTrue={x:this.vt.toTrueX(target[0]),
                      y:this.vt.toTrueY(target[1])};
      let holdFound = holdList.Request(targetTrue.x,targetTrue.y,
                         this.drawObject.id);
      if (holdFound!=undefined)
      {
        AddStatus(JSON.stringify(holdFound));
        targetTrue.x=holdFound.x;
        targetTrue.y=holdFound.y;
      }

      let center = {x:targetTrue.x-diam/2,y:targetTrue.y};
      
      // find the angle for a tangent to the turn in circle
      let theta = ToDegrees(Math.asin((diam/2)/
                    Math.hypot(center.x-this.xpos,center.y-this.ypos)));
      //AddStatus("theta="+theta.toFixed(1));

      // mark the start of the hold with a diamond
      DrawFix(targetTrue.x,targetTrue.y,2,"radial");
      DrawSquare(center.x,center.y,2,"radial")

      // create a vector from the current position to the center
      // of the turn in arc
      //AddStatus("center"+vt.toScreenX(center.x).toFixed(1)+
                         //vt.toScreenY(center.y).toFixed(1));

      // Mark current point and create a vector to it
      //DrawSquare(this.xpos,this.ypos,2,"radial");
      let centerV=new Vector(center.x-this.xpos,center.y-this.ypos);
      //AddStatus("centerV heading="+FixHeading(centerV.GetDirection()+90));

      // centerV angle relative to 90deg
      let rotate = centerV.GetDirection();
      rotate += rotate>0?-theta:theta;
      //AddStatus("rotation="+rotate.toFixed(1));

      // create a vector from turn in center to tangent point
      let smallTangentV=new Vector(0,-1);
      //AddStatus("smallTangentV heading="+
                 //FixHeading(smallTangentV.GetDirection()+90));
      smallTangentV.SetLength(diam/2);
      smallTangentV.RotateMe(rotate);
      //AddStatus("smallTangentV direction="+
                //FixHeading(smallTangentV.GetDirection()+90));

      // Mark the target on the turn in circle
      let tangentTarget = [center.x+smallTangentV.x,center.y+smallTangentV.y];
      //DrawSquare(center.x+smallTangentV.x,center.y+smallTangentV.y,2,"radial");

      this.FlyRadialFromCurrentPosition(tangentTarget);
      this.hp.SetLeg(traveling,[targetTrue.x,targetTrue.y]);
    }
    else
    {
      this.SlewTo(new Vector(0,1));
      this.hp.StartHold(this.xpos,this.ypos);
    }
  }
  Diam2MinPix()
  {
    //let speed = this.GetSpeed()/60; //miles per minute
    //let diam = 2*speed/Math.PI; // diameter of 2minute turn in mi 
    //let diamPix = 10*diam; // in pixels
    return this.GetSpeed()/(3*Math.PI);
  }

  GetHeading()
  {
    return Math.round(FixHeading(this.vector.GetDirection()+90));
  }
  SetHeading(heading)
  {
    this.vector.SetDirection(heading-90);
    this.CancelHold();
  }
  ColorLoop()
  {
    try
    {
      if(!this.ContainsColor("green"))return;
      if (this.color=="green")
        this.color=this.colors[this.colors.length-1];
      else
        this.color="green";
    }
    catch(err)
    {
      AddStatus("ColorLoop err="+err);
    }
  }
  BlinkColor()
  {
    this.colorid=setInterval(this.ColorLoop.bind(this),1000);
  }
  GetColor()
  {
    if (!this.ContainsColor("green"))
      return this.drawObject.color;
    else
      return this.color;
  }
  ContainsColor(color)
  {
    return this.colors.indexOf(color)!=-1;
  }
  // currently green, orange, red, silver
  SetColor(color)
  {
    if (this.colors.indexOf(color)!=-1)
      return;
    if (color=="green")
    {
      this.BlinkColor();
      this.color="green";
    }
    this.colors.push(color);
    this.colors=this.colors.sort();
    this.drawObject.color=this.colors[this.colors.length-1];
  }
  ClearColor(color="all")
  {
    if (color=="all" || color=="green")clearInterval(this.colorid);
    if (color=="all")
    {
      this.colors=["black"];
      return;
    }
    let i = this.colors.indexOf(color);
    if (i<1)
      return;
    this.colors.splice(i,1);
    this.drawObject.color=this.colors[this.colors.length-1];
  }

  GetSpeed()
  {
    return MvSpeed(this,this.vt.fi/1000,10);
  }

  SetSpeed(speed)
  {
    let currentSpeed= MvSpeed(this,this.vt.fi/1000,10);
    this.vector.ScaleMe(speed/currentSpeed);
  }

  SlewToSpeed(speed)
  {
    this.targetSpeed=speed;
  }

  SetAltitude(alt)
  {
    this.targetAlt=alt;
  }

  CancelSlew()
  {
    this.turnDeltaAngle=0;
  }

  SlewTo(vector,turnType)
  {
    if (turnType==undefined)
    {
      this.CancelHold();// breaks a hold if in one
      this.radial=undefined;
      turnType=this.shortestTurn;
    }
    let angleBetween=this.vector.AngleBetween(vector);
    let slewRate=this.vt.fi/333.3;
    switch (turnType)
    {
      case this.shortestTurn:
        this.turnDeltaAngle=angleBetween>0?slewRate:-slewRate;
      break;

      case this.leftTurn:
      this.turnDeltaAngle=-slewRate;
      break;

      case this.rightTurn:
      this.turnDeltaAngle=slewRate;
      break;
    }
    this.turnTargetDirection=vector.GetDirection();
  }

  // drawArray = [{action:"line"/"move",dx:1,dy:1}, ...]
  // draws relative to the current xpos,ypos location
  DrawPath(ctx,drawArray,rotate=0)
  {
    //AddStatus("Entering DrawPath");
    let firstMove=true
    let zoomMult=1+.95*(this.vt.scale-1)
    ctx.beginPath();
    for (let da of drawArray)
    {
      let x;
      let y;
      //AddStatus("x,y="+x+","+y);
      if (rotate!=0)
      {
        let theta = rotate*Math.PI/180;
        let newdx = da.dx*Math.cos(theta)+da.dy*Math.sin(theta);
        let newdy = -da.dx*Math.sin(theta)+da.dy*Math.cos(theta);
        //AddStatus("newdx,newdy="+newdx+","+newdy);
        x=this.xpos+newdx/zoomMult;
        y=this.ypos+newdy/zoomMult;
      }
      else
      {
        x = this.xpos+da.dx/zoomMult;
        y = this.ypos+da.dy/zoomMult;
      }
      switch (da.action)
      {
      case "move":
      ctx.moveTo(vt.toScreenX(x),vt.toScreenY(y));
      break;

      case "line":
      ctx.lineTo(vt.toScreenX(x),vt.toScreenY(y));
      break;
      }
    }
    ctx.strokeStyle=this.GetColor();
    ctx.stroke();
  }

  Draw(ctx)
  {
    //AddStatus("Entering Draw");
    let drw=this.drawObject;
    let xpos = this.xpos;
    let ypos = this.ypos;
    switch (drw.type)
    {
      case "plane":
      let rotate = this.vector.GetDirection();
      let halflen=drw.length/2;
      let quarterlen=halflen/2;
      let halfwid=drw.width/2;
      let quarterwid=halfwid/2;
      var ma = 
      [
      {action:"move",dx:-quarterlen, dy:0},
      {action:"line",dx:halflen,     dy:0},
      {action:"move",dx:-quarterlen, dy:halfwid},
      {action:"line",dx:quarterlen,  dy:0},
      {action:"line",dx:-quarterlen, dy:-halfwid},
      {action:"move",dx:-halflen,    dy:-quarterwid},
      {action:"line",dx:-quarterlen, dy:0},
      {action:"line",dx:-halflen,    dy:quarterwid},
      ];
      this.DrawPath(ctx,ma,-rotate);
      if (vt.scale>.75) // write the aircraft tag
      {
        // MvSpeed(movingVector,frameRate,pixelsPerMile)
        let speed = (MvSpeed(this,.03,10)).toFixed(0);
        let heading = FixHeading(Math.round(this.vector.GetDirection()+90));
        ctx.fillStyle="black";
        ctx.textAlign = "center";
        ctx.fillText(heading+" "+speed+
                     " FL"+Math.round(this.alt/100),vt.toScreenX(this.xpos), 
                     vt.toScreenY(this.ypos-10/vt.scale));
        if (this.hp.Holding())
           ctx.fillText("Hold",vt.toScreenX(this.xpos), 
                     vt.toScreenY(this.ypos+15/vt.scale));
      }
      if (this.hp.Holding())
      {
        this.hp.Draw(ctx);
      }
      if (this.radial!=undefined)
        this.radial.DrawLineToTarget();
      break;
    }
    //AddStatus("Exiting Draw");
  }

  Move()
  {
    //AddStatus("Entering Move()");
    try
    {
    if (this.drawObject.drag!=0)
    {
      this.vector.ScaleMe(1-this.drawObject.drag);
    }
    if (this.drawObject.gravity!=0)
    { 
      this.vector.y-=this.drawObject.gravity; 
    }
      
    if (this.alt != this.targetAlt)
    {
      let deltaAlt = vt.FrameIntervalInSeconds()*vt.vs/60;
      if (this.targetAlt<this.alt)deltaAlt*=-1;
      this.alt+=deltaAlt;
      if (Math.abs(this.alt-this.targetAlt)<=deltaAlt)
        this.alt=this.targetAlt;
    }
    //get("debug08").innerHTML="";
    get("debug06").innerHTML=(this.hp.GetLegName());
    if (this.turnDeltaAngle!=0)
    //  completed a turn
    {
      //AddStatus("this.turnDeltaAngle!=0");
      let deltaAngle=this.turnTargetDirection-this.vector.GetDirection();
      if (Math.abs(deltaAngle)<Math.abs(this.turnDeltaAngle))
      {
        this.vector=this.vector.ProjectOn(
                    this.vector.Rotate(deltaAngle));
        this.turnDeltaAngle=0;
        // on course after a turn
        // if in a hold, mark the beginning of the leg
        if (this.hp.GetLeg()!=none)
        {
          switch (this.hp.GetLeg())
          {
            case entering:
            //AddStatus("start hold, in southturn");
            this.hp.SetLeg(southturn,[this.xpos,this.ypos]);
            this.SlewTo(new Vector(0,-1),this.rightTurn);
            break;

            case southturn:
            this.hp.SetLeg(westleg);
            break;

            case northturn:
            this.hp.SetLeg(eastleg);
            break;
          }
        }
      }
      else
      {
        let nextVector = this.vector.Rotate(this.turnDeltaAngle);
        //AddStatus("Next Vector...\n"+JSON.stringify(nextVector));
        this.vector=this.vector.ProjectOn(nextVector);
      }
    }
    else if (this.radial!=undefined)
    {
      //get("debug08").innerHTML=this.radial.GetStateName()
      switch (this.radial.GetState())
      {
        case radial_tracking:
        if (this.radial.IsAtTarget())
        {
          if (this.hp.GetLeg()==traveling)
          {
            this.SlewTo(new Vector(0,1),this.rightTurn);
            this.radial.SetState(radial_turnin);
          }
          else
            this.radial=undefined;
        }
        else
        {
          let correction = this.radial.GetVector();
          if (!AreEqual(this.vector.GetDirection(),correction.GetDirection()))
          {
            this.SlewTo(correction,this.shortestTurn);
          }
          //drawLine(this.xpos,this.ypos,
          //         this.radial.target.x,this.radial.target.y);
        }
        break;

        case radial_turnin:
        if (AreEqual(this.GetHeading(),180))
        {
          //AddStatus("Heading=180");
          this.radial=undefined;
          this.Hold();
        }
        break;
      }
    }
    else if (this.hp.Holding() || this.hp.GetLeg()==traveling)
    {
      if (this.hp.GetLeg()==traveling)
      {
        let target = this.hp.GetTarget();
        let dist= Math.hypot(target.x-this.xpos,target.y-this.ypos);
        if (dist<.1)
        {
          this.Hold();
        }
        else
        {
        let temp = new Vector(target.x-this.xpos,target.y-this.ypos);
        if (!temp.IsSameDirection(this.vector))
          this.SlewTo(temp,this.shortestTurn);
        }
      }
      else if (this.hp.IsEndOfLeg(this.xpos,this.ypos))
      {
        switch (this.hp.GetLeg())
        {
          case eastleg:
          this.SlewTo(new Vector(0,-1),this.rightTurn);
          this.hp.SetLeg(southturn);
          break;
          case westleg:
          this.SlewTo(new Vector(0,1),this.rightTurn);
          this.hp.SetLeg(northturn);
          break;
        }
        //this.hold="turn";
      }
    }
    if (this.targetSpeed!=undefined)
    {
      let currentSpeed = this.GetSpeed();
      let ds = this.deltaSpeed;
      if (currentSpeed > this.targetSpeed)
        ds*=-1;
      let newSpeed=currentSpeed+ds;
      if (Math.abs(newSpeed-this.targetSpeed)<this.deltaSpeed)
      {
        this.SetSpeed(this.targetSpeed);
        this.targetSpeed=undefined;
      }
      else
        this.SetSpeed(newSpeed);
    }
    this.xpos+=this.vector.x;
    this.ypos+=this.vector.y;

    }
    catch(err)
    {
      AddStatus(err);
    }
    //AddStatus("Exiting Move()");
  }

  CancelHold()
  {
    this.hp.CancelHold();
  }

  MovingAway(that,debug=false)
  { 
    let thisnextx=this.xpos+this.vector.x;
    let thisnexty=this.ypos+this.vector.y;

    let thatnextx=that.xpos+that.vector.x;
    let thatnexty=that.ypos+that.vector.y;

    let dist=Math.hypot(this.xpos-that.xpos,this.ypos-that.ypos);
    let nextdist=Math.hypot(thisnextx-thatnextx,thisnexty-thatnexty);

    if (debug)
    {
      AddStatus("thisx = "+this.xpos);
      AddStatus("thisy = "+this.ypos);
      AddStatus("thatx = "+that.xpos);
      AddStatus("thaty = "+that.ypos);

      AddStatus("thisnextx = "+thisnextx);
      AddStatus("thisnexty = "+thisnexty);
      AddStatus("thatnextx = "+thatnextx);
      AddStatus("thatnexty = "+thatnexty);

      AddStatus("initial dist = "+dist);
      AddStatus("next dist = "+nextdist);
    }
    return nextdist>dist;
  }
}

const radial_tracking=0;
const radial_turnin=1;
const radialStateNames=["Tracking","TurnIn"]
class FlyRadial
{
  // radial = vector to the target
  // target = {x:xpos,y:ypos}
  constructor(radial,target,movingVector)
  {
    this.radial=radial;
    this.target=target; //true position
    this.mv=movingVector;
    this.state=radial_tracking;
    this.startx=this.mv.xpos;
    this.starty=this.mv.ypos;
  }
  GetState()
  {
    return this.state;
  }
  SetState(state)
  {
    this.state=state;
  }
  GetStateName()
  {
    return radialStateNames[this.GetState()];
  }
  DrawLineToTarget()
  {
    vt.ctx.beginPath();
    vt.ctx.moveTo(vt.toScreenX(this.startx),vt.toScreenY(this.starty));
    vt.ctx.lineTo(vt.toScreenX(this.target.x),vt.toScreenY(this.target.y));
    vt.ctx.stroke();
  }
  GetVector()
  {
    let cv = this.mv.vector;
    let cl = {x:this.mv.xpos,y:this.mv.ypos};
    this.dist = Math.hypot(this.target.x-cl.x,this.target.y-cl.y);
    let vectorToTarget = new Vector(this.target.x-cl.x,this.target.y-cl.y);
    //get("debug08").innerHTML="target="+this.target.x+","+this.target.y;
    let dot = vectorToTarget.Dot(this.radial);
    if (dot<0)
      // heading the wrong direction
      // turn to parallel the radial
      return this.radial.Unit();
    let headingError=this.radial.AngleBetween(vectorToTarget);
    /*
    vectorToTarget takes us directly to the target. Ideally, We want to get 
    on the radial before the target. Rotating vectorToTarget by the 
    difference between the radial and the vectorToTarget, will asymptotically
    approach the target, so rotate by some factor greater than 1 
    */
    const maxError=30.0; 
    headingError*=5.0;
    if (headingError>maxError)
      headingError=maxError;
    else if (headingError<-maxError)
      headingError=-maxError;
    let newVector = vectorToTarget.Rotate(headingError);
    return newVector;
  }
  IsAtTarget()
  {
    if (this.dist<.1)
      return true;
    return false;
  }
}
// manages a hold pattern, currently left turns only
// xpos/ypos mark the beginning of the east leg
// speed is in mph
const none=0;
const entering=1
const eastleg=2;
const northturn=3;
const westleg=4;
const southturn=5;
const traveling=6;
const legNames=["none","entering","eastleg","northturn","westleg",
                "southturn","traveling"];
class HoldPattern
{
  constructor(xpos,ypos,movingVector)
  {
    this.xstart=xpos;
    this.ystart=ypos;
    this.mv=movingVector;
    this.vt=this.mv.vt;
    this.holding=false;
    this.speed = null; //miles per minute
    this.diam = null; // diameter of 2minute turn in mi 
    // next 4 are the screen coords of the straight legs
    this.x1 = null; // east leg x coord
    this.y1 = null; // bottom of the legs
    this.x2 = null; // west leg x coord
    this.y2 = null; // top of the legs
    this.tcx = null; // x coord of the center of the turns
    this.radius = null; // turn radius
    this.onleg=none;
  }
  Holding()
  {
    return this.holding;
  }
  Draw(ctx)
  {
    try
    {
    if (!this.holding)return;
    this.ComputeOval();
    ctx.beginPath();
    ctx.moveTo(this.x1,this.y1);
    ctx.lineTo(this.x1,this.y2);
    ctx.arc(this.tcx, this.y2, this.radius, ToRadians(0), ToRadians(180),true);
    //ctx.moveTo(x2,y2);
    ctx.lineTo(this.x2,this.y1);
    ctx.arc(this.tcx, this.y1, this.radius, ToRadians(180), ToRadians(0),true);
    ctx.stroke();
    }
    catch(err)
    {
      AddStatus(err);
    }
  }
  LegLength()
  {
    let speed = this.GetSpeed()/60;
    return speed; // speed is in miles per minute
  }
  ScreenLegLen()
  {
    return this.LegLength()*10*this.vt.scale;
  }
  CancelHold()
  {
    this.holding=false;
    this.onleg=none;
    holdList.Remove(this.mv.drawObject.id);
  }
  StartHold(xpos,ypos)
  {
    //AddStatus("in StartHold");
    this.xstart=Number(xpos);
    this.ystart=Number(ypos);
    this.ComputeOval();
    this.SetLeg(entering);
  }
  ComputeOval() // in screen coordinates
  {
    let testx1=this.vt.toScreenX(this.xstart);
    let testy1=this.vt.toScreenY(this.ystart);
    if (this.speed==this.mv.GetSpeed()/60 &&
        this.x1==testx1 && this.y1==testy1)return;
    this.speed = this.mv.GetSpeed()/60; //miles per minute
    this.diam = 2*this.speed/Math.PI; // diameter of 2minute turn in mi 
    this.x1 = testx1;
    this.x2 = this.x1-(this.diam*10)*this.vt.scale; 
    this.y1 = testy1;
    this.y2 = this.y1-10*this.speed*this.vt.scale;
    this.tcx = (this.x1+this.x2)/2;
    this.radius = Math.abs(this.tcx-this.x1);
  }
  Extents(screen=true)
  {
    return screen?
           {east:this.x1,west:this.x2,north:this.y2,south:this.y1}:
           {east:vt.toTrueX(this.x1),west:vt.toTrueX(this.x2),
            north:vt.toTrueY(this.y2),south:vt.toTrueY(this.y1)};
  }
  SetLeg(position,xypos)
  {
    //AddStatus("SetLeg "+this.GetLegName(position));
    if (xypos!=undefined)
    {
      this.xstart=xypos[0];
      this.ystart=xypos[1];
    }
    this.onleg=position;
    if (position==entering || position==none || position==traveling)
      this.holding=false;
    else
      this.holding=true; 
  }
  GetLeg()
  {
    //get("debug04").innerHTML=legNames[this.onleg];
    return this.onleg;
  }
  GetLegName(leg)
  {
    return leg!=undefined?legNames[leg]:legNames[this.onleg];
  }
  GetTarget()
  {
    return {x:this.xstart,y:this.ystart};
  }
  IsEndOfLeg(xpos,ypos)
  {
    if (this.onleg==northturn || this.onleg==southturn)return false;
    let sx = vt.toScreenX(xpos);
    let sy = vt.toScreenY(ypos);
    let len;
    switch (this.onleg)
    {
    case westleg:
    len = sy-this.y2;
    //get("debug05").innerHTML="on "+legNames[this.onleg]+" "+len.toFixed(1); 
    if (len<0)
      return true;
    break;

    case eastleg:
    len = this.y1-sy;
    //get("debug05").innerHTML="on "+legNames[this.onleg]+" "+len.toFixed(1); 
    if (len<0)
      return true;
    break;
    }
    return false;
  }
}
