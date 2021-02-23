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

  AngleBetween(other) 
  {
    let between=(other.GetDirection()-this.GetDirection());
    if (between<0)between+=360;
    if (between>180)between=between-360;
    //AddStatus("between="+between);
    return between;
  }
  
  // Functions that return boolean
  IsSameDirection(other) 
  {
    const dotProduct = this.Unit().Dot(other.Unit())
    return AreEqual(dotProduct, 1)
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
const squareObj={type:"square",sidelen:15,color:"black",drag:0,gravity:0};
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
    this.colorid=null;
    this.color="black"
    this.colors=["black"]; // default
    this.targetSpeed=undefined;
    this.deltaSpeed=.5;
    //this.BlinkColor();
    //AddStatus(JSON.stringify(this.drawObject));
    //AddStatus("View="+JSON.stringify(this.vt));
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
  GetHeading()
  {
    return Math.round(FixHeading(this.vector.GetDirection()+90));
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

  SlewTo(vector)
  {
    //AddStatus("Entering SlewTo(vector)");
    let angleBetween=this.vector.AngleBetween(vector);
    let slewRate=this.vt.fi/333.3;
    this.turnDeltaAngle=angleBetween>0?slewRate:-slewRate;
    this.turnTargetDirection=vector.GetDirection();
    //AddStatus(this.turnTargetDirection);
    //AddStatus("Exiting SlewTo(vector)");
  }

  // drawArray = [{move:"line"/"move"/"stroke",dx:1,dy:1}, ...]
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
      case "circle":
      //{type:"circle",radius:15,color:"black"};
      ctx.beginPath();
      ctx.arc(vt.toScreenX(xpos), vt.toScreenY(ypos), 
              drw.radius*vt.scale, 0, 2 * Math.PI);
      if (drw.color=="red")
      {
        ctx.fillStyle=drw.color;
        ctx.fill();
      }
      ctx.stroke();
      break;

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
      if (vt.scale>.75)
      {
        // MvSpeed(movingVector,frameRate,pixelsPerMile)
        let speed = (MvSpeed(this,.03,10)).toFixed(0);
        let heading = FixHeading(Math.round(this.vector.GetDirection()+90));
        ctx.fillStyle="black";
        ctx.textAlign = "center";
        ctx.fillText(heading+" "+speed+
                     " FL"+Math.round(this.alt/100),vt.toScreenX(this.xpos), 
                     vt.toScreenY(this.ypos-10/vt.scale));
      }
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
    if (this.turnDeltaAngle!=0)
    {
      //AddStatus("this.turnDeltaAngle!=0");
      let deltaAngle=this.turnTargetDirection-this.vector.GetDirection();
      if (Math.abs(deltaAngle)<Math.abs(this.turnDeltaAngle))
      {
        this.vector=this.vector.ProjectOn(
                    this.vector.Rotate(deltaAngle));
        this.turnDeltaAngle=0;
      }
      else
      {
        let nextVector = this.vector.Rotate(this.turnDeltaAngle);
        //AddStatus("Next Vector...\n"+JSON.stringify(nextVector));
        this.vector=this.vector.ProjectOn(nextVector);
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
    //AddStatus("Exiting Move");
    }
    catch(err)
    {
      AddStatus(err);
    }
    //AddStatus("Exiting Move()");
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
