export const degrees=(v:number)=>(v%360+360)%360;
export function compassHeading(e:any,angle=0):number|null{
 if(typeof e.webkitCompassHeading==='number'&&Number.isFinite(e.webkitCompassHeading)&&!(typeof e.webkitCompassAccuracy==='number'&&e.webkitCompassAccuracy<0))return degrees(e.webkitCompassHeading+angle);
 // Relative orientation has an arbitrary zero and cannot indicate north.
 if(!(e.absolute===true||e.type==='deviceorientationabsolute')||typeof e.alpha!=='number'||!Number.isFinite(e.alpha))return null;
 const a=e.alpha*Math.PI/180,b=(e.beta??0)*Math.PI/180,g=(e.gamma??0)*Math.PI/180,s=angle*Math.PI/180;
 const x=Math.sin(s),y=Math.cos(s);
 const east=(Math.cos(a)*Math.cos(g)-Math.sin(a)*Math.sin(b)*Math.sin(g))*x-Math.sin(a)*Math.cos(b)*y;
 const north=(Math.sin(a)*Math.cos(g)+Math.cos(a)*Math.sin(b)*Math.sin(g))*x+Math.cos(a)*Math.cos(b)*y;
 return Math.hypot(east,north)<.15?null:degrees(Math.atan2(east,north)*180/Math.PI);
}
