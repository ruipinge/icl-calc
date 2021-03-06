(this["webpackJsonpicl-calc"]=this["webpackJsonpicl-calc"]||[]).push([[0],{169:function(e,t,i){},170:function(e,t,i){"use strict";i.r(t);i(1);var a=i(58),c=i.n(a),r=i(4),n=i(172),l=i(0),s=function(e){var t=e.label,i=e.name,a=e.unit,c=e.unitTitle,n=e.placeholder,s=e.error,o=e.value,d=e.disabled;return Object(l.jsxs)("div",{className:"form-group row",children:[Object(l.jsx)("label",{htmlFor:i+"field",className:"col-sm-6 col-form-label",children:t}),Object(l.jsx)("div",{className:"col-sm-6",children:Object(l.jsxs)("div",{className:"input-group",children:[d?Object(l.jsx)("input",{name:i,value:o,className:"form-control text-right",disabled:!0}):Object(l.jsx)(r.b,{type:"number",name:i,className:(s?"is-invalid":"")+" form-control text-right",placeholder:n,autoComplete:"off"}),a?Object(l.jsx)("div",{className:"input-group-append",children:Object(l.jsx)("span",{className:"input-group-text",title:c,children:a})}):null,Object(l.jsx)(r.a,{name:i,component:"div",className:"invalid-feedback"})]})})]})},o=i(3),d="Invalid value.",m="Required value.",b="".concat(d," [").concat(2.7,", ").concat(6,"]"),u="".concat(d," [").concat(20,", ").concat(70,"]"),j="".concat(d," [").concat(300,", ").concat(700,"]"),p="".concat(d," [").concat(-25,", ").concat(0,"]"),h="".concat(d," [").concat(-8,", ").concat(0,"]"),f=o.c().shape({patient:o.c().shape({dateOfBirth:o.a().optional().typeError("Invalid date. (yyyy-mm-dd)")}),biometrics:o.c().shape({ata:o.b().required(m).min(0,d).max(20,d),wtw:o.b().required(m).min(0,d).max(20,d),clr:o.b().required(m).min(-1e3,d).max(1e3,d),acq:o.b().required(m).min(2.7,b).max(6,b),acan:o.b().required(m).min(0,d).max(70,d),acat:o.b().required(m).min(0,d).max(70,d),kf:o.b().required(m).min(20,u).max(70,u),cct:o.b().required(m).min(300,j).max(700,j)}),spectacleRefraction:o.c().shape({sphere:o.b().required(m).min(-25,p).max(0,p),cylindre:o.b().required(m).min(-8,h).max(0,h),axis:o.b().required(m).min(0,d).max(180,d),vertex:o.b().required(m).min(0,d).max(20,d)})}),x=-1.33756,v=.9446,O=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:2;return Math.round(e*Math.pow(10,t))/Math.pow(10,t)},g=function(e){return x+v*e},N=function(e,t){return x+v*(e+t)},y=function(e,t){var i=g(e),a=N(e,t);return O(i-a)},C=function(e,t){var i=N(e,t)-g(e);return O(g(e)+i/2)},R=function(e){var t=e.initialValues;e.setStatus;return Object(l.jsx)(r.d,{initialValues:t,validationSchema:f,onSubmit:function(e,t){var i=t.setSubmitting;setTimeout((function(){alert(JSON.stringify(e,null,2)),i(!1)}),400)},children:function(e){var t,i,a,c,o,d,m,b,u,j,p,h,f,x,v,g,R,A,q=e.errors,w=e.touched,T=e.values;return Object(l.jsxs)(r.c,{children:[Object(l.jsx)("h2",{children:"Patient"}),Object(l.jsxs)("div",{className:"form-row",children:[Object(l.jsxs)("div",{className:"form-group col-md-4",children:[Object(l.jsx)("label",{htmlFor:"fieldName",children:"Name"}),Object(l.jsx)(r.b,{name:"patient.name",className:"form-control",id:"fieldName",placeholder:"enter patient name",autoComplete:"off"})]}),Object(l.jsxs)("div",{className:"form-group col-md-2 offset-md-1",children:[Object(l.jsx)("label",{htmlFor:"fieldDateOfBirth",children:"Date of Birth"}),Object(l.jsx)(r.b,{name:"patient.dateOfBirth",className:((null===(t=q.patient)||void 0===t?void 0:t.dateOfBirth)&&(null===(i=w.patient)||void 0===i?void 0:i.dateOfBirth)?"is-invalid":"")+" form-control",id:"fieldDateOfBirth",placeholder:"yyyy-mm-dd",autoComplete:"off",maxLength:10}),Object(l.jsx)(r.a,{name:"patient.dateOfBirth",component:"div",className:"invalid-feedback"})]}),Object(l.jsxs)("div",{className:"form-group col-md-1 offset-md-1",children:[Object(l.jsx)("label",{htmlFor:"fieldAge",children:"Age"}),Object(l.jsxs)("div",{className:"input-group",children:[Object(l.jsx)("input",{name:"patient.age",className:"form-control text-right",id:"fieldAge",disabled:!0,value:T.patient.dateOfBirth&&!(null===(a=q.patient)||void 0===a?void 0:a.dateOfBirth)&&Object(n.a)(new Date,new Date(T.patient.dateOfBirth))||""}),Object(l.jsx)("div",{className:"input-group-append",children:Object(l.jsx)("span",{className:"input-group-text",title:"years",children:"yr."})})]})]}),Object(l.jsxs)("div",{className:"form-group col-md-2 offset-md-1",children:[Object(l.jsx)("label",{htmlFor:"fieldEye",children:"Eye"}),Object(l.jsxs)(r.b,{as:"select",name:"eye",className:"form-control",id:"fieldEye",autoComplete:"off",children:[Object(l.jsx)("option",{value:"",children:"Select..."}),Object(l.jsx)("option",{value:"left",children:"Left"}),Object(l.jsx)("option",{value:"right",children:"Right"})]})]})]}),Object(l.jsx)("hr",{}),Object(l.jsxs)("div",{className:"form-row",children:[Object(l.jsxs)("div",{className:"col-md-4",children:[Object(l.jsx)("h2",{children:"Biometrics"}),Object(l.jsx)(s,{label:"Angle to Angle (AtA)",name:"biometrics.ata",unit:"mm",error:null===(c=q.biometrics)||void 0===c?void 0:c.ata}),Object(l.jsx)(s,{label:"White to White (WtW)",name:"biometrics.wtw",unit:"mm",unitTitle:"millimetres",error:null===(o=q.biometrics)||void 0===o?void 0:o.wtw}),Object(l.jsx)(s,{label:"Crystaline Lens Rise (CLR)",name:"biometrics.clr",unit:"nm",unitTitle:"nanometres",error:null===(d=q.biometrics)||void 0===d?void 0:d.clr}),Object(l.jsx)(s,{label:"Internal Anterior Chamber Depth (ACQ)",name:"biometrics.acq",unit:"mm",unitTitle:"millimetres",error:null===(m=q.biometrics)||void 0===m?void 0:m.acq}),Object(l.jsx)(s,{label:"Anterior Chamber Angle nasal (ACAn)",name:"biometrics.acan",unit:"\xba",unitTitle:"degrees",error:null===(b=q.biometrics)||void 0===b?void 0:b.acan}),Object(l.jsx)(s,{label:"Anterior Chamber Angle temporal (ACAt)",name:"biometrics.acat",unit:"\xba",unitTitle:"degrees",error:null===(u=q.biometrics)||void 0===u?void 0:u.acat}),Object(l.jsx)(s,{label:"Keratometry - Flat Meridian (Kf)",name:"biometrics.kf",unit:"dpt",unitTitle:"dioptres",error:null===(j=q.biometrics)||void 0===j?void 0:j.kf}),Object(l.jsx)(s,{label:"Central Corneal Thickness (CCT)",name:"biometrics.cct",unit:"\u03bcm",unitTitle:"micrometres",error:null===(p=q.biometrics)||void 0===p?void 0:p.cct})]}),Object(l.jsxs)("div",{className:"col-md-3 offset-md-1",children:[Object(l.jsx)("h2",{children:"Spectacle Refraction"}),Object(l.jsx)(s,{label:"Sphere",name:"spectacleRefraction.sphere",unit:"dpt",unitTitle:"dioptres",error:null===(h=q.spectacleRefraction)||void 0===h?void 0:h.sphere}),Object(l.jsx)(s,{label:"Cylindre",name:"spectacleRefraction.cylindre",unit:"dpt",unitTitle:"dioptres",error:null===(f=q.spectacleRefraction)||void 0===f?void 0:f.cylindre}),Object(l.jsx)(s,{label:"Axis",name:"spectacleRefraction.axis",unit:"\xba",unitTitle:"degrees",error:null===(x=q.spectacleRefraction)||void 0===x?void 0:x.axis}),Object(l.jsx)(s,{label:"Vertex",name:"spectacleRefraction.vertex",unit:"mm",unitTitle:"millimetres",error:null===(v=q.spectacleRefraction)||void 0===v?void 0:v.vertex})]}),Object(l.jsxs)("div",{className:"col-md-3 offset-md-1",children:[Object(l.jsx)("h2",{children:"ICL Power"}),Object(l.jsx)(s,{label:"Sphere",name:"iclSphere",value:(R=T.spectacleRefraction.sphere,A=T.spectacleRefraction.cylindre,O(N(R,A))),unit:"dpt",unitTitle:"dioptres",disabled:!0}),Object(l.jsx)(s,{label:"Cylindre",name:"iclCylindre",value:y(T.spectacleRefraction.sphere,T.spectacleRefraction.cylindre),unit:"dpt",unitTitle:"dioptres",disabled:!0}),Object(l.jsx)(s,{label:"Axis",name:"iclAxis",value:(g=T.spectacleRefraction.axis,O(g>=0&&g<90?g+90:g>90&&g<=180?g-90:g,1)),unit:"\xba",unitTitle:"degrees",disabled:!0}),Object(l.jsx)(s,{label:"Spherical Equivalent",value:C(T.spectacleRefraction.sphere,T.spectacleRefraction.cylindre),name:"iclSphericalEquivalent",unit:"\xba",unitTitle:"degrees",disabled:!0})]})]})]})}})},A=function(e){return Object(l.jsxs)("div",{children:["renderICLPower: ",e]})},q=function(){return Object(l.jsxs)(l.Fragment,{children:[Object(l.jsx)("nav",{className:"navbar navbar-expand navbar-dark bg-dark fixed-top",children:Object(l.jsxs)("div",{className:"container",children:[Object(l.jsx)("a",{className:"navbar-brand",href:"#",children:"ICL Size Calc"}),Object(l.jsx)("ul",{className:"navbar-nav mr-auto"}),Object(l.jsx)("form",{className:"form-inline",children:Object(l.jsx)("button",{type:"button",className:"btn btn-danger",children:"Reset"})})]})}),Object(l.jsx)("div",{className:"container",children:Object(l.jsx)(R,{initialValues:{patient:{name:"",dateOfBirth:"",eye:"left"},biometrics:{ata:0,wtw:0,clr:0,acq:0,acan:0,acat:0,kf:0,cct:0},spectacleRefraction:{sphere:0,cylindre:0,axis:0,vertex:0}},setStatus:A})})]})},w=function(){return Object(l.jsx)(q,{})};i(169);c.a.render(Object(l.jsx)(w,{}),document.getElementById("root"))}},[[170,1,2]]]);
//# sourceMappingURL=main.30bb8c5d.chunk.js.map