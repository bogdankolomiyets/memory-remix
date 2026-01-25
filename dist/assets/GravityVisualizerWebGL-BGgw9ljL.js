import{V as b,S as je,Q as pe,ab as ee,a as C,ad as ce,M as B,T as Z,R as tt,P as ot,d0 as x,d3 as Y,d4 as te,d5 as nt,d6 as at,i as it,d7 as ue,b9 as st,e as _e,cu as rt,ct as lt,d2 as L,d8 as ct,aR as me,n as de,aH as Re,a6 as Fe,d9 as ut}from"../bundle.js";var pt=Object.defineProperty,mt=(l,a,n)=>a in l?pt(l,a,{enumerable:!0,configurable:!0,writable:!0,value:n}):l[a]=n,dt=(l,a,n)=>(mt(l,a+"",n),n);class ft{constructor(){dt(this,"_listeners")}addEventListener(a,n){this._listeners===void 0&&(this._listeners={});const e=this._listeners;e[a]===void 0&&(e[a]=[]),e[a].indexOf(n)===-1&&e[a].push(n)}hasEventListener(a,n){if(this._listeners===void 0)return!1;const e=this._listeners;return e[a]!==void 0&&e[a].indexOf(n)!==-1}removeEventListener(a,n){if(this._listeners===void 0)return;const d=this._listeners[a];if(d!==void 0){const c=d.indexOf(n);c!==-1&&d.splice(c,1)}}dispatchEvent(a){if(this._listeners===void 0)return;const e=this._listeners[a.type];if(e!==void 0){a.target=this;const d=e.slice(0);for(let c=0,u=d.length;c<u;c++)d[c].call(this,a);a.target=null}}}var ht=Object.defineProperty,vt=(l,a,n)=>a in l?ht(l,a,{enumerable:!0,configurable:!0,writable:!0,value:n}):l[a]=n,i=(l,a,n)=>(vt(l,typeof a!="symbol"?a+"":a,n),n);const J=new tt,Ce=new ot,gt=Math.cos(70*(Math.PI/180)),Ie=(l,a)=>(l%a+a)%a;let bt=class extends ft{constructor(a,n){super(),i(this,"object"),i(this,"domElement"),i(this,"enabled",!0),i(this,"target",new b),i(this,"minDistance",0),i(this,"maxDistance",1/0),i(this,"minZoom",0),i(this,"maxZoom",1/0),i(this,"minPolarAngle",0),i(this,"maxPolarAngle",Math.PI),i(this,"minAzimuthAngle",-1/0),i(this,"maxAzimuthAngle",1/0),i(this,"enableDamping",!1),i(this,"dampingFactor",.05),i(this,"enableZoom",!0),i(this,"zoomSpeed",1),i(this,"enableRotate",!0),i(this,"rotateSpeed",1),i(this,"enablePan",!0),i(this,"panSpeed",1),i(this,"screenSpacePanning",!0),i(this,"keyPanSpeed",7),i(this,"zoomToCursor",!1),i(this,"autoRotate",!1),i(this,"autoRotateSpeed",2),i(this,"reverseOrbit",!1),i(this,"reverseHorizontalOrbit",!1),i(this,"reverseVerticalOrbit",!1),i(this,"keys",{LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"}),i(this,"mouseButtons",{LEFT:B.ROTATE,MIDDLE:B.DOLLY,RIGHT:B.PAN}),i(this,"touches",{ONE:Z.ROTATE,TWO:Z.DOLLY_PAN}),i(this,"target0"),i(this,"position0"),i(this,"zoom0"),i(this,"_domElementKeyEvents",null),i(this,"getPolarAngle"),i(this,"getAzimuthalAngle"),i(this,"setPolarAngle"),i(this,"setAzimuthalAngle"),i(this,"getDistance"),i(this,"getZoomScale"),i(this,"listenToKeyEvents"),i(this,"stopListenToKeyEvents"),i(this,"saveState"),i(this,"reset"),i(this,"update"),i(this,"connect"),i(this,"dispose"),i(this,"dollyIn"),i(this,"dollyOut"),i(this,"getScale"),i(this,"setScale"),this.object=a,this.domElement=n,this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this.getPolarAngle=()=>h.phi,this.getAzimuthalAngle=()=>h.theta,this.setPolarAngle=t=>{let o=Ie(t,2*Math.PI),r=h.phi;r<0&&(r+=2*Math.PI),o<0&&(o+=2*Math.PI);let v=Math.abs(o-r);2*Math.PI-v<v&&(o<r?o+=2*Math.PI:r+=2*Math.PI),y.phi=o-r,e.update()},this.setAzimuthalAngle=t=>{let o=Ie(t,2*Math.PI),r=h.theta;r<0&&(r+=2*Math.PI),o<0&&(o+=2*Math.PI);let v=Math.abs(o-r);2*Math.PI-v<v&&(o<r?o+=2*Math.PI:r+=2*Math.PI),y.theta=o-r,e.update()},this.getDistance=()=>e.object.position.distanceTo(e.target),this.listenToKeyEvents=t=>{t.addEventListener("keydown",re),this._domElementKeyEvents=t},this.stopListenToKeyEvents=()=>{this._domElementKeyEvents.removeEventListener("keydown",re),this._domElementKeyEvents=null},this.saveState=()=>{e.target0.copy(e.target),e.position0.copy(e.object.position),e.zoom0=e.object.zoom},this.reset=()=>{e.target.copy(e.target0),e.object.position.copy(e.position0),e.object.zoom=e.zoom0,e.object.updateProjectionMatrix(),e.dispatchEvent(d),e.update(),p=s.NONE},this.update=(()=>{const t=new b,o=new b(0,1,0),r=new pe().setFromUnitVectors(a.up,o),v=r.clone().invert(),T=new b,F=new pe,V=2*Math.PI;return function(){const Le=e.object.position;r.setFromUnitVectors(a.up,o),v.copy(r).invert(),t.copy(Le).sub(e.target),t.applyQuaternion(r),h.setFromVector3(t),e.autoRotate&&p===s.NONE&&oe(ze()),e.enableDamping?(h.theta+=y.theta*e.dampingFactor,h.phi+=y.phi*e.dampingFactor):(h.theta+=y.theta,h.phi+=y.phi);let z=e.minAzimuthAngle,U=e.maxAzimuthAngle;isFinite(z)&&isFinite(U)&&(z<-Math.PI?z+=V:z>Math.PI&&(z-=V),U<-Math.PI?U+=V:U>Math.PI&&(U-=V),z<=U?h.theta=Math.max(z,Math.min(U,h.theta)):h.theta=h.theta>(z+U)/2?Math.max(z,h.theta):Math.min(U,h.theta)),h.phi=Math.max(e.minPolarAngle,Math.min(e.maxPolarAngle,h.phi)),h.makeSafe(),e.enableDamping===!0?e.target.addScaledVector(I,e.dampingFactor):e.target.add(I),e.zoomToCursor&&N||e.object.isOrthographicCamera?h.radius=ie(h.radius):h.radius=ie(h.radius*P),t.setFromSpherical(h),t.applyQuaternion(v),Le.copy(e.target).add(t),e.object.matrixAutoUpdate||e.object.updateMatrix(),e.object.lookAt(e.target),e.enableDamping===!0?(y.theta*=1-e.dampingFactor,y.phi*=1-e.dampingFactor,I.multiplyScalar(1-e.dampingFactor)):(y.set(0,0,0),I.set(0,0,0));let W=!1;if(e.zoomToCursor&&N){let X=null;if(e.object instanceof ce&&e.object.isPerspectiveCamera){const K=t.length();X=ie(K*P);const $=K-X;e.object.position.addScaledVector(j,$),e.object.updateMatrixWorld()}else if(e.object.isOrthographicCamera){const K=new b(M.x,M.y,0);K.unproject(e.object),e.object.zoom=Math.max(e.minZoom,Math.min(e.maxZoom,e.object.zoom/P)),e.object.updateProjectionMatrix(),W=!0;const $=new b(M.x,M.y,0);$.unproject(e.object),e.object.position.sub($).add(K),e.object.updateMatrixWorld(),X=t.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),e.zoomToCursor=!1;X!==null&&(e.screenSpacePanning?e.target.set(0,0,-1).transformDirection(e.object.matrix).multiplyScalar(X).add(e.object.position):(J.origin.copy(e.object.position),J.direction.set(0,0,-1).transformDirection(e.object.matrix),Math.abs(e.object.up.dot(J.direction))<gt?a.lookAt(e.target):(Ce.setFromNormalAndCoplanarPoint(e.object.up,e.target),J.intersectPlane(Ce,e.target))))}else e.object instanceof ee&&e.object.isOrthographicCamera&&(W=P!==1,W&&(e.object.zoom=Math.max(e.minZoom,Math.min(e.maxZoom,e.object.zoom/P)),e.object.updateProjectionMatrix()));return P=1,N=!1,W||T.distanceToSquared(e.object.position)>E||8*(1-F.dot(e.object.quaternion))>E?(e.dispatchEvent(d),T.copy(e.object.position),F.copy(e.object.quaternion),W=!1,!0):!1}})(),this.connect=t=>{e.domElement=t,e.domElement.style.touchAction="none",e.domElement.addEventListener("contextmenu",Oe),e.domElement.addEventListener("pointerdown",Ae),e.domElement.addEventListener("pointercancel",G),e.domElement.addEventListener("wheel",Se)},this.dispose=()=>{var t,o,r,v,T,F;e.domElement&&(e.domElement.style.touchAction="auto"),(t=e.domElement)==null||t.removeEventListener("contextmenu",Oe),(o=e.domElement)==null||o.removeEventListener("pointerdown",Ae),(r=e.domElement)==null||r.removeEventListener("pointercancel",G),(v=e.domElement)==null||v.removeEventListener("wheel",Se),(T=e.domElement)==null||T.ownerDocument.removeEventListener("pointermove",se),(F=e.domElement)==null||F.ownerDocument.removeEventListener("pointerup",G),e._domElementKeyEvents!==null&&e._domElementKeyEvents.removeEventListener("keydown",re)};const e=this,d={type:"change"},c={type:"start"},u={type:"end"},s={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let p=s.NONE;const E=1e-6,h=new je,y=new je;let P=1;const I=new b,_=new C,w=new C,S=new C,O=new C,R=new C,D=new C,A=new C,m=new C,f=new C,j=new b,M=new C;let N=!1;const g=[],q={};function ze(){return 2*Math.PI/60/60*e.autoRotateSpeed}function H(){return Math.pow(.95,e.zoomSpeed)}function oe(t){e.reverseOrbit||e.reverseHorizontalOrbit?y.theta+=t:y.theta-=t}function fe(t){e.reverseOrbit||e.reverseVerticalOrbit?y.phi+=t:y.phi-=t}const he=(()=>{const t=new b;return function(r,v){t.setFromMatrixColumn(v,0),t.multiplyScalar(-r),I.add(t)}})(),ve=(()=>{const t=new b;return function(r,v){e.screenSpacePanning===!0?t.setFromMatrixColumn(v,1):(t.setFromMatrixColumn(v,0),t.crossVectors(e.object.up,t)),t.multiplyScalar(r),I.add(t)}})(),k=(()=>{const t=new b;return function(r,v){const T=e.domElement;if(T&&e.object instanceof ce&&e.object.isPerspectiveCamera){const F=e.object.position;t.copy(F).sub(e.target);let V=t.length();V*=Math.tan(e.object.fov/2*Math.PI/180),he(2*r*V/T.clientHeight,e.object.matrix),ve(2*v*V/T.clientHeight,e.object.matrix)}else T&&e.object instanceof ee&&e.object.isOrthographicCamera?(he(r*(e.object.right-e.object.left)/e.object.zoom/T.clientWidth,e.object.matrix),ve(v*(e.object.top-e.object.bottom)/e.object.zoom/T.clientHeight,e.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),e.enablePan=!1)}})();function ne(t){e.object instanceof ce&&e.object.isPerspectiveCamera||e.object instanceof ee&&e.object.isOrthographicCamera?P=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),e.enableZoom=!1)}function Q(t){ne(P/t)}function ae(t){ne(P*t)}function ge(t){if(!e.zoomToCursor||!e.domElement)return;N=!0;const o=e.domElement.getBoundingClientRect(),r=t.clientX-o.left,v=t.clientY-o.top,T=o.width,F=o.height;M.x=r/T*2-1,M.y=-(v/F)*2+1,j.set(M.x,M.y,1).unproject(e.object).sub(e.object.position).normalize()}function ie(t){return Math.max(e.minDistance,Math.min(e.maxDistance,t))}function be(t){_.set(t.clientX,t.clientY)}function Ue(t){ge(t),A.set(t.clientX,t.clientY)}function ye(t){O.set(t.clientX,t.clientY)}function Ye(t){w.set(t.clientX,t.clientY),S.subVectors(w,_).multiplyScalar(e.rotateSpeed);const o=e.domElement;o&&(oe(2*Math.PI*S.x/o.clientHeight),fe(2*Math.PI*S.y/o.clientHeight)),_.copy(w),e.update()}function Ve(t){m.set(t.clientX,t.clientY),f.subVectors(m,A),f.y>0?Q(H()):f.y<0&&ae(H()),A.copy(m),e.update()}function He(t){R.set(t.clientX,t.clientY),D.subVectors(R,O).multiplyScalar(e.panSpeed),k(D.x,D.y),O.copy(R),e.update()}function ke(t){ge(t),t.deltaY<0?ae(H()):t.deltaY>0&&Q(H()),e.update()}function Be(t){let o=!1;switch(t.code){case e.keys.UP:k(0,e.keyPanSpeed),o=!0;break;case e.keys.BOTTOM:k(0,-e.keyPanSpeed),o=!0;break;case e.keys.LEFT:k(e.keyPanSpeed,0),o=!0;break;case e.keys.RIGHT:k(-e.keyPanSpeed,0),o=!0;break}o&&(t.preventDefault(),e.update())}function xe(){if(g.length==1)_.set(g[0].pageX,g[0].pageY);else{const t=.5*(g[0].pageX+g[1].pageX),o=.5*(g[0].pageY+g[1].pageY);_.set(t,o)}}function Me(){if(g.length==1)O.set(g[0].pageX,g[0].pageY);else{const t=.5*(g[0].pageX+g[1].pageX),o=.5*(g[0].pageY+g[1].pageY);O.set(t,o)}}function Te(){const t=g[0].pageX-g[1].pageX,o=g[0].pageY-g[1].pageY,r=Math.sqrt(t*t+o*o);A.set(0,r)}function Ze(){e.enableZoom&&Te(),e.enablePan&&Me()}function Ge(){e.enableZoom&&Te(),e.enableRotate&&xe()}function Ee(t){if(g.length==1)w.set(t.pageX,t.pageY);else{const r=le(t),v=.5*(t.pageX+r.x),T=.5*(t.pageY+r.y);w.set(v,T)}S.subVectors(w,_).multiplyScalar(e.rotateSpeed);const o=e.domElement;o&&(oe(2*Math.PI*S.x/o.clientHeight),fe(2*Math.PI*S.y/o.clientHeight)),_.copy(w)}function Pe(t){if(g.length==1)R.set(t.pageX,t.pageY);else{const o=le(t),r=.5*(t.pageX+o.x),v=.5*(t.pageY+o.y);R.set(r,v)}D.subVectors(R,O).multiplyScalar(e.panSpeed),k(D.x,D.y),O.copy(R)}function we(t){const o=le(t),r=t.pageX-o.x,v=t.pageY-o.y,T=Math.sqrt(r*r+v*v);m.set(0,T),f.set(0,Math.pow(m.y/A.y,e.zoomSpeed)),Q(f.y),A.copy(m)}function We(t){e.enableZoom&&we(t),e.enablePan&&Pe(t)}function Xe(t){e.enableZoom&&we(t),e.enableRotate&&Ee(t)}function Ae(t){var o,r;e.enabled!==!1&&(g.length===0&&((o=e.domElement)==null||o.ownerDocument.addEventListener("pointermove",se),(r=e.domElement)==null||r.ownerDocument.addEventListener("pointerup",G)),Je(t),t.pointerType==="touch"?Qe(t):Ke(t))}function se(t){e.enabled!==!1&&(t.pointerType==="touch"?$e(t):qe(t))}function G(t){var o,r,v;et(t),g.length===0&&((o=e.domElement)==null||o.releasePointerCapture(t.pointerId),(r=e.domElement)==null||r.ownerDocument.removeEventListener("pointermove",se),(v=e.domElement)==null||v.ownerDocument.removeEventListener("pointerup",G)),e.dispatchEvent(u),p=s.NONE}function Ke(t){let o;switch(t.button){case 0:o=e.mouseButtons.LEFT;break;case 1:o=e.mouseButtons.MIDDLE;break;case 2:o=e.mouseButtons.RIGHT;break;default:o=-1}switch(o){case B.DOLLY:if(e.enableZoom===!1)return;Ue(t),p=s.DOLLY;break;case B.ROTATE:if(t.ctrlKey||t.metaKey||t.shiftKey){if(e.enablePan===!1)return;ye(t),p=s.PAN}else{if(e.enableRotate===!1)return;be(t),p=s.ROTATE}break;case B.PAN:if(t.ctrlKey||t.metaKey||t.shiftKey){if(e.enableRotate===!1)return;be(t),p=s.ROTATE}else{if(e.enablePan===!1)return;ye(t),p=s.PAN}break;default:p=s.NONE}p!==s.NONE&&e.dispatchEvent(c)}function qe(t){if(e.enabled!==!1)switch(p){case s.ROTATE:if(e.enableRotate===!1)return;Ye(t);break;case s.DOLLY:if(e.enableZoom===!1)return;Ve(t);break;case s.PAN:if(e.enablePan===!1)return;He(t);break}}function Se(t){e.enabled===!1||e.enableZoom===!1||p!==s.NONE&&p!==s.ROTATE||(t.preventDefault(),e.dispatchEvent(c),ke(t),e.dispatchEvent(u))}function re(t){e.enabled===!1||e.enablePan===!1||Be(t)}function Qe(t){switch(De(t),g.length){case 1:switch(e.touches.ONE){case Z.ROTATE:if(e.enableRotate===!1)return;xe(),p=s.TOUCH_ROTATE;break;case Z.PAN:if(e.enablePan===!1)return;Me(),p=s.TOUCH_PAN;break;default:p=s.NONE}break;case 2:switch(e.touches.TWO){case Z.DOLLY_PAN:if(e.enableZoom===!1&&e.enablePan===!1)return;Ze(),p=s.TOUCH_DOLLY_PAN;break;case Z.DOLLY_ROTATE:if(e.enableZoom===!1&&e.enableRotate===!1)return;Ge(),p=s.TOUCH_DOLLY_ROTATE;break;default:p=s.NONE}break;default:p=s.NONE}p!==s.NONE&&e.dispatchEvent(c)}function $e(t){switch(De(t),p){case s.TOUCH_ROTATE:if(e.enableRotate===!1)return;Ee(t),e.update();break;case s.TOUCH_PAN:if(e.enablePan===!1)return;Pe(t),e.update();break;case s.TOUCH_DOLLY_PAN:if(e.enableZoom===!1&&e.enablePan===!1)return;We(t),e.update();break;case s.TOUCH_DOLLY_ROTATE:if(e.enableZoom===!1&&e.enableRotate===!1)return;Xe(t),e.update();break;default:p=s.NONE}}function Oe(t){e.enabled!==!1&&t.preventDefault()}function Je(t){g.push(t)}function et(t){delete q[t.pointerId];for(let o=0;o<g.length;o++)if(g[o].pointerId==t.pointerId){g.splice(o,1);return}}function De(t){let o=q[t.pointerId];o===void 0&&(o=new C,q[t.pointerId]=o),o.set(t.pageX,t.pageY)}function le(t){const o=t.pointerId===g[0].pointerId?g[1]:g[0];return q[o.pointerId]}this.dollyIn=(t=H())=>{ae(t),e.update()},this.dollyOut=(t=H())=>{Q(t),e.update()},this.getScale=()=>P,this.setScale=t=>{ne(t),e.update()},this.getZoomScale=()=>H(),n!==void 0&&this.connect(n),this.update()}};const yt=x.forwardRef(({makeDefault:l,camera:a,regress:n,domElement:e,enableDamping:d=!0,keyEvents:c=!1,onChange:u,onStart:s,onEnd:p,...E},h)=>{const y=Y(f=>f.invalidate),P=Y(f=>f.camera),I=Y(f=>f.gl),_=Y(f=>f.events),w=Y(f=>f.setEvents),S=Y(f=>f.set),O=Y(f=>f.get),R=Y(f=>f.performance),D=a||P,A=e||_.connected||I.domElement,m=x.useMemo(()=>new bt(D),[D]);return te(()=>{m.enabled&&m.update()},-1),x.useEffect(()=>(c&&m.connect(c===!0?A:c),m.connect(A),()=>void m.dispose()),[c,A,n,m,y]),x.useEffect(()=>{const f=N=>{y(),n&&R.regress(),u&&u(N)},j=N=>{s&&s(N)},M=N=>{p&&p(N)};return m.addEventListener("change",f),m.addEventListener("start",j),m.addEventListener("end",M),()=>{m.removeEventListener("start",j),m.removeEventListener("end",M),m.removeEventListener("change",f)}},[u,s,p,m,y,w]),x.useEffect(()=>{if(l){const f=O().controls;return S({controls:m}),()=>S({controls:f})}},[l,m]),x.createElement("primitive",nt({ref:h,object:m,enableDamping:d},E))}),Ne=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,xt=`
  uniform sampler2D positions;
  uniform sampler2D velocities;
  uniform float uTimeScale;
  uniform vec3 uBoundHalfExtent; 

  varying vec2 vUv;

  void main() {
    vec4 posData = texture2D(positions, vUv);
    vec3 pos = posData.xyz;
    vec3 vel = texture2D(velocities, vUv).xyz;
    float mass = posData.w; // Preserve mass in W component

    // TSL uses fixed step 1/60
    float delta = (1.0 / 60.0) * uTimeScale;
    
    pos += vel * delta;

    // Boundary Wrapping (Teleport at edges)
    // TSL Logic: mod(pos + half, bound) - half
    // uBoundHalfExtent = 8.0 -> half = 4.0
    vec3 boundary = uBoundHalfExtent; 
    vec3 halfBoundary = boundary / 2.0;
    
    pos = mod(pos + halfBoundary, boundary) - halfBoundary;

    gl_FragColor = vec4(pos, mass);
  }
`,Mt=`
  uniform sampler2D positions;
  uniform sampler2D velocities;
  
  uniform vec3 uAttractorsPos[3];
  uniform vec3 uAttractorsAxis[3];
  
  uniform float uAttractorMass;
  uniform float uG;
  uniform float uSpinningStrength;
  uniform float uMaxSpeed;
  uniform float uVelocityDamping;
  uniform float uTimeScale;
  uniform float uParticleGlobalMass;

  varying vec2 vUv;

  void main() {
    vec4 posData = texture2D(positions, vUv);
    vec3 pos = posData.xyz;
    vec3 vel = texture2D(velocities, vUv).xyz;
    
    // Particle mass stored in W component (range 0.25 - 1.0 multiplier)
    float pMassMultiplier = posData.w; 
    float pMass = pMassMultiplier * uParticleGlobalMass;

    vec3 force = vec3(0.0);

    // Loop over 3 attractors
    for(int i = 0; i < 3; i++) {
        vec3 attrPos = uAttractorsPos[i];
        vec3 attrAxis = uAttractorsAxis[i];

        vec3 toAttractor = attrPos - pos;
        float dist = length(toAttractor);
        
        // Add small epsilon to avoid division by zero
        float distSq = max(0.00001, dist * dist);
        
        // 1. Gravity
        // TSL: float(ATTRACTOR_MASS).mul(particleMass).mul(float(GRAVITY_CONSTANT)).div(distance.pow(2))
        float gravStrength = (uAttractorMass * pMass * uG) / distSq;
        vec3 dir = normalize(toAttractor);

        // OUTER LAYER: Weak repulsion (-10%) to make them drift away slowly
        bool isOuterLayer = pMassMultiplier < 0.5;
        float gravMod = isOuterLayer ? -0.1 : 1.0;
        
        vec3 gravForce = dir * gravStrength * gravMod;
        
        force += gravForce;

        // 2. Spin (Rotation)
        // TSL: attractorRotationAxis.mul(gravityStrength).mul(float(SPINNING_STRENGTH))
        vec3 spinForceVec = attrAxis * gravStrength * uSpinningStrength;
        
        // OUTER LAYER: Spin in REVERSE direction
        if (isOuterLayer) {
            spinForceVec *= -1.0;
        }
        
        // TSL: spinningForce.cross(toAttractor) <-- UNNORMALIZED VECTOR !!!
        vec3 spinVel = cross(spinForceVec, toAttractor);
        
        force += spinVel;
    }

    float delta = (1.0 / 60.0) * uTimeScale;
    
    // Velocity integration
    vel += force * delta;

    // Speed limit
    float speed = length(vel);
    if(speed > uMaxSpeed) {
        vel = normalize(vel) * uMaxSpeed;
    }

    // Damping
    vel *= (1.0 - uVelocityDamping);

    gl_FragColor = vec4(vel, 1.0);
  }
`,Tt=l=>{const a=l*l,n=new Float32Array(4*a);for(let d=0;d<l;d++)for(let c=0;c<l;c++){const u=d*l+c;n[4*u]=(Math.random()-.5)*5,n[4*u+1]=(Math.random()-.5)*.2,n[4*u+2]=(Math.random()-.5)*5,n[4*u+3]=Math.random()*.75+.25}const e=new Fe(n,l,l,de,me);return e.needsUpdate=!0,e},Et=l=>{const a=l*l,n=new Float32Array(4*a);for(let d=0;d<a;d++){const c=Math.random()*Math.PI*2,u=Math.random()*Math.PI;n[4*d]=Math.sin(c)*Math.sin(u)*.05,n[4*d+1]=Math.cos(c)*.05,n[4*d+2]=Math.sin(c)*Math.cos(u)*.05,n[4*d+3]=1}const e=new Fe(n,l,l,de,me);return e.needsUpdate=!0,e},Pt=({attractorsData:l,count:a=262144})=>{const n=Math.round(Math.sqrt(a)),{gl:e}=Y(),d=()=>new at(n,n,{minFilter:Re,magFilter:Re,format:de,type:me,stencilBuffer:!1,depthBuffer:!1}),c=x.useRef([d(),d()]),u=x.useRef([d(),d()]),s=x.useRef(),p=x.useMemo(()=>new it,[]),E=x.useMemo(()=>new ee(-1,1,1,-1,0,1),[]),h=x.useRef(!0),y=x.useRef({pos:null,vel:null});y.current.pos||(y.current.pos=Tt(n),y.current.vel=Et(n));const P=new b(0,1,0),I=new b(0,1,0),_=new b(1,0,-.5).normalize(),w=x.useMemo(()=>new ue({uniforms:{positions:{value:null},velocities:{value:null},uAttractorsPos:{value:[new b,new b,new b]},uAttractorsAxis:{value:[P.clone(),I.clone(),_.clone()]},uAttractorMass:{value:1e7},uG:{value:667e-13},uSpinningStrength:{value:2.75},uMaxSpeed:{value:8},uVelocityDamping:{value:.1},uTimeScale:{value:1},uParticleGlobalMass:{value:1e4}},vertexShader:Ne,fragmentShader:Mt}),[]),S=x.useMemo(()=>new ue({uniforms:{positions:{value:null},velocities:{value:null},uTimeScale:{value:1},uBoundHalfExtent:{value:new b(8,8,8)}},vertexShader:Ne,fragmentShader:xt}),[]),O=x.useMemo(()=>new ue({uniforms:{positions:{value:null},velocities:{value:null},uPointSize:{value:3.5},uColorA:{value:new _e("#ffffff")},uColorB:{value:new _e("#ffffff")},uMaxSpeed:{value:8}},vertexShader:`
            uniform sampler2D positions;
            uniform sampler2D velocities;
            uniform float uPointSize;
            uniform float uMaxSpeed;
            uniform vec3 uColorA;
            uniform vec3 uColorB;
            varying vec3 vColor;
            
            void main() {
                vec4 posData = texture2D(positions, position.xy);
                vec3 pos = posData.xyz;
                float massMultiplier = posData.w; // Read mass from W
                
                vec3 vel = texture2D(velocities, position.xy).rgb;

                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_Position = projectionMatrix * mvPosition;

                float speed = length(vel);
                float colorMix = smoothstep(0.0, uMaxSpeed * 0.5, speed);
                vColor = mix(uColorA, uColorB, colorMix);
                
                // TSL: scale = 0.008, massMultiplier from W component
                // Heavier particles are LARGER (like original)
                gl_PointSize = uPointSize * massMultiplier * (10.0 / -mvPosition.z);
            }
        `,fragmentShader:`
            varying vec3 vColor;
            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                if(dist > 0.5) discard;
                
                float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
                
                gl_FragColor = vec4(vColor, alpha * 0.6); 
            }
        `,transparent:!0,blending:st,depthWrite:!1}),[]),R=x.useMemo(()=>{const D=new rt,A=new Float32Array(n*n*3);for(let m=0;m<n*n;m++){const f=m%n/n,j=Math.floor(m/n)/n;A[m*3]=f,A[m*3+1]=j,A[m*3+2]=0}return D.setAttribute("position",new lt(A,3)),D},[n]);return te((D,A)=>{if(h.current){e.initRenderTarget(c.current[0]),e.initRenderTarget(c.current[1]),e.initRenderTarget(u.current[0]),e.initRenderTarget(u.current[1]);const f=y.current.pos,j=y.current.vel;e.copyTextureToTexture(f,c.current[0].texture),e.copyTextureToTexture(f,c.current[1].texture),e.copyTextureToTexture(j,u.current[0].texture),e.copyTextureToTexture(j,u.current[1].texture),h.current=!1}if(l){const f=w.uniforms.uAttractorsPos.value,j=w.uniforms.uAttractorsAxis.value;for(let M=0;M<3;M++)l[M]&&(f[M].copy(l[M].position),j[M].copy(l[M].axis));w.uniformsNeedUpdate=!0}w.uniforms.positions.value=c.current[0].texture,w.uniforms.velocities.value=u.current[0].texture,s.current.material=w,e.setRenderTarget(u.current[1]),e.render(p,E),S.uniforms.positions.value=c.current[0].texture,S.uniforms.velocities.value=u.current[1].texture,s.current.material=S,e.setRenderTarget(c.current[1]),e.render(p,E),e.setRenderTarget(null);let m=u.current[0];u.current[0]=u.current[1],u.current[1]=m,m=c.current[0],c.current[0]=c.current[1],c.current[1]=m,O.uniforms.positions.value=c.current[0].texture,O.uniforms.velocities.value=u.current[0].texture}),L.jsxs(L.Fragment,{children:[ct(L.jsx("mesh",{ref:s,children:L.jsx("planeGeometry",{args:[2,2]})}),p),L.jsx("points",{geometry:R,material:O})]})},wt=({position:l,axis:a,isInteractive:n=!1})=>{const e=x.useRef();return te(()=>{if(e.current){e.current.position.copy(l);const d=new pe().setFromUnitVectors(new b(0,1,0),a);e.current.quaternion.copy(d)}}),null},At=({analyserRef:l,attractorsRefs:a,loadedAudioPlaybackSourceRef:n,loadedAudioPlayRateRef:e,loadedAudioLoopIsSelectedRef:d})=>{const c=x.useMemo(()=>new Uint8Array(2048),[]);return te(()=>{n!=null&&n.current&&(n.current.playbackRate.value=e.current||1,n.current.loop=d.current);const u=a.length;if(l!=null&&l.current){const s=l.current;s.getByteTimeDomainData(c);const p=s.frequencyBinCount;for(let E=0;E<u;E++){if(!a[E])continue;const h=Math.floor(E/u*p);if(h<c.length){const y=(c[h]-128)/128,P=a[E].basePos.y+y*5;a[E].position.set(a[E].basePos.x,P,a[E].basePos.z)}}}else for(let s=0;s<u;s++)a[s]&&a[s].position.copy(a[s].basePos)}),null},Lt=({analyserRef:l,loadedAudioPlaybackSourceRef:a,loadedAudioPlayRateRef:n,loadedAudioLoopIsSelectedRef:e,particleCount:d,dpr:c})=>{const u=x.useMemo(()=>[{position:new b(-1,0,0),axis:new b(0,1,0),basePos:new b(-1,0,0)},{position:new b(1,0,-.5),axis:new b(0,1,0),basePos:new b(1,0,-.5)},{position:new b(0,.5,1),axis:new b(1,0,-.5).normalize(),basePos:new b(0,.5,1)}],[]);return L.jsx("div",{style:{width:"100%",height:"100%",position:"absolute",top:0,left:0},children:L.jsxs(ut,{camera:{position:[3,5,8],fov:25},gl:{antialias:!0,alpha:!0},dpr:c||window.devicePixelRatio,style:{width:"100%",height:"100%"},children:[L.jsx(yt,{minDistance:.1,maxDistance:50,enablePan:!0,enableZoom:!0}),L.jsx("ambientLight",{intensity:.5}),L.jsx("directionalLight",{position:[4,2,0],intensity:1.5}),L.jsx(At,{analyserRef:l,attractorsRefs:u,loadedAudioPlaybackSourceRef:a,loadedAudioPlayRateRef:n,loadedAudioLoopIsSelectedRef:e}),u.map((s,p)=>L.jsx(wt,{position:s.position,axis:s.axis},p)),L.jsx(Pt,{attractorsData:u,count:d||32768})]})})};export{Lt as default};
