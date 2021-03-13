(this["webpackJsonpicl-calc"]=this["webpackJsonpicl-calc"]||[]).push([[0],{188:function(e,t,c){},189:function(e,t,c){"use strict";c.r(t);c(1);var r=c(75),a=c.n(r),i=c(20),n=c(38),l=c(11),s=c(22),o=c(2),d=c(5),m="Invalid value.",b="Required value.",j="".concat(m," [").concat(2.7,", ").concat(6,"]"),u="".concat(m," [").concat(20,", ").concat(70,"]"),h="".concat(m," [").concat(300,", ").concat(700,"]"),v="".concat(m," [").concat(-25,", ").concat(0,"]"),x="".concat(m," [").concat(-8,", ").concat(0,"]"),p=d.c().shape({patient:d.c().shape({dateOfBirth:d.a().optional().typeError("Invalid date. (yyyy-mm-dd)")}),biometrics:d.c().shape({ata:d.b().required(b).min(0,m).max(20,m),wtw:d.b().required(b).min(0,m).max(20,m),clr:d.b().required(b).min(-1e3,m).max(1e3,m),acq:d.b().required(b).min(2.7,j).max(6,j),acan:d.b().required(b).min(0,m).max(70,m),acat:d.b().required(b).min(0,m).max(70,m),kf:d.b().required(b).min(20,u).max(70,u),cct:d.b().required(b).min(300,h).max(700,h)}),spectacleRefraction:d.c().shape({sphere:d.b().required(b).min(-25,v).max(0,v),cylindre:d.b().required(b).min(-8,x).max(0,x),axis:d.b().required(b).min(0,m).max(180,m),vertex:d.b().required(b).min(0,m).max(20,m)})}),O=c(0),f=function(){return Object(O.jsx)(O.Fragment,{children:"Floating Matrix is coming soon..."})},g=function(){return Object(O.jsx)(O.Fragment,{children:"Normality Graphs are coming soon..."})},N=c(6),y=function(e){var t=e.error,c=e.touched,r=e.base,a=void 0===r?["form-control"]:r,i=e.invalid,n=void 0===i?["is-invalid"]:i,l=e.valid,s=void 0===l?[]:l;return[].concat(Object(N.a)(a),Object(N.a)(t&&c?n:s)).join(" ")},R=new Map([["mm","millimetres"],["nm","nanometres"],["\xba","degrees"],["dpt","dioptres"],["\u03bcm","micrometres"]]),C=function(e){var t=e.unit;return Object(O.jsx)("div",{className:"input-group-append",children:Object(O.jsx)("span",{className:"input-group-text",title:R.get(t),children:t})})},w=function(e){var t=e.label,c=e.name,r=e.unit,a=e.placeholder,i=e.error,n=e.touched,s=e.value,o=e.disabled;return Object(O.jsxs)("div",{className:"form-group row",children:[Object(O.jsx)("label",{htmlFor:c+"field",className:"col-sm-6 col-form-label",children:t}),Object(O.jsx)("div",{className:"col-sm-6",children:Object(O.jsxs)("div",{className:"input-group",children:[o?Object(O.jsx)("input",{name:c,value:s,className:"form-control text-right",disabled:!0}):Object(O.jsx)(l.b,{type:"number",name:c,className:y({error:i,touched:n,base:["form-control","text-right"]}),placeholder:a,autoComplete:"off"}),Object(O.jsx)(C,{unit:r}),Object(O.jsx)(l.a,{name:c,component:"div",className:"invalid-feedback"})]})})]})},q=function(e){var t,c,r,a,i,n,l,s,o,d,m,b,j,u,h,v,x=e.errors,p=e.touched;return Object(O.jsxs)(O.Fragment,{children:[Object(O.jsx)("h4",{children:"Biometrics"}),Object(O.jsx)(w,{label:"Angle to Angle (AtA)",name:"biometrics.ata",unit:"mm",error:null===(t=x.biometrics)||void 0===t?void 0:t.ata,touched:null===(c=p.biometrics)||void 0===c?void 0:c.ata}),Object(O.jsx)(w,{label:"White to White (WtW)",name:"biometrics.wtw",unit:"mm",error:null===(r=x.biometrics)||void 0===r?void 0:r.wtw,touched:null===(a=p.biometrics)||void 0===a?void 0:a.wtw}),Object(O.jsx)(w,{label:"Crystaline Lens Rise (CLR)",name:"biometrics.clr",unit:"nm",error:null===(i=x.biometrics)||void 0===i?void 0:i.clr,touched:null===(n=p.biometrics)||void 0===n?void 0:n.clr}),Object(O.jsx)(w,{label:"Internal Anterior Chamber Depth (ACQ)",name:"biometrics.acq",unit:"mm",error:null===(l=x.biometrics)||void 0===l?void 0:l.acq,touched:null===(s=p.biometrics)||void 0===s?void 0:s.acq}),Object(O.jsx)(w,{label:"Anterior Chamber Angle nasal (ACAn)",name:"biometrics.acan",unit:"\xba",error:null===(o=x.biometrics)||void 0===o?void 0:o.acan,touched:null===(d=p.biometrics)||void 0===d?void 0:d.acan}),Object(O.jsx)(w,{label:"Anterior Chamber Angle temporal (ACAt)",name:"biometrics.acat",unit:"\xba",error:null===(m=x.biometrics)||void 0===m?void 0:m.acat,touched:null===(b=p.biometrics)||void 0===b?void 0:b.acat}),Object(O.jsx)(w,{label:"Keratometry - Flat Meridian (Kf)",name:"biometrics.kf",unit:"dpt",error:null===(j=x.biometrics)||void 0===j?void 0:j.kf,touched:null===(u=p.biometrics)||void 0===u?void 0:u.kf}),Object(O.jsx)(w,{label:"Central Corneal Thickness (CCT)",name:"biometrics.cct",unit:"\u03bcm",error:null===(h=x.biometrics)||void 0===h?void 0:h.cct,touched:null===(v=p.biometrics)||void 0===v?void 0:v.cct})]})},A=-1.33756,F=.9446,k=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:2;return Math.round(e*Math.pow(10,t))/Math.pow(10,t)},B=function(e){return A+F*e},S=function(e){var t=e.sphere,c=e.cylindre;return A+F*(t+c)},E=function(e){var t=e.sphere,c=e.cylindre;return k(S({sphere:t,cylindre:c}))},I=function(e){var t=e.sphere,c=e.cylindre,r=B(t),a=S({sphere:t,cylindre:c});return k(r-a)},M=function(e){var t=e.sphere,c=e.cylindre,r=S({sphere:t,cylindre:c})-B(t);return k(B(t)+r/2)},D=function(e){e.errors,e.touched;var t,c=e.values;return Object(O.jsxs)(O.Fragment,{children:[Object(O.jsx)("h4",{children:"ICL Power"}),Object(O.jsx)(w,{label:"Sphere",name:"iclSphere",value:E({sphere:c.spectacleRefraction.sphere,cylindre:c.spectacleRefraction.cylindre}),unit:"dpt",disabled:!0}),Object(O.jsx)(w,{label:"Cylindre",name:"iclCylindre",value:I({sphere:c.spectacleRefraction.sphere,cylindre:c.spectacleRefraction.cylindre}),unit:"dpt",disabled:!0}),Object(O.jsx)(w,{label:"Axis",name:"iclAxis",value:(t=c.spectacleRefraction.axis,k(t>=0&&t<90?t+90:t>90&&t<=180?t-90:t,1)),unit:"\xba",disabled:!0}),Object(O.jsx)(w,{label:"Spherical Equivalent",value:M({sphere:c.spectacleRefraction.sphere,cylindre:c.spectacleRefraction.cylindre}),name:"iclSphericalEquivalent",unit:"\xba",disabled:!0})]})},L=c(191),W=function(e){var t=e.dateOfBirth,c=e.error;return t&&!c&&Object(L.a)(new Date,new Date(t))||0},J=function(e){var t,c,r,a,i=e.errors,n=e.values,s=e.touched;return Object(O.jsxs)(O.Fragment,{children:[Object(O.jsx)("h4",{children:"Information"}),Object(O.jsxs)("div",{className:"form-row",children:[Object(O.jsxs)("div",{className:"form-group col-md-4",children:[Object(O.jsx)("label",{htmlFor:"fieldName",children:"Name"}),Object(O.jsx)(l.b,{name:"patient.name",className:"form-control",id:"fieldName",placeholder:"enter patient name",autoComplete:"off"})]}),Object(O.jsxs)("div",{className:"form-group col-md-2 offset-md-1",children:[Object(O.jsx)("label",{htmlFor:"fieldDateOfBirth",children:"Date of Birth"}),Object(O.jsx)(l.b,{name:"patient.dateOfBirth",className:y({error:null===(t=i.patient)||void 0===t?void 0:t.dateOfBirth,touched:null===(c=s.patient)||void 0===c?void 0:c.dateOfBirth}),id:"fieldDateOfBirth",placeholder:"yyyy-mm-dd",autoComplete:"off",maxLength:10}),Object(O.jsx)(l.a,{name:"patient.dateOfBirth",component:"div",className:"invalid-feedback"})]}),Object(O.jsxs)("div",{className:"form-group col-md-2",children:[Object(O.jsx)("label",{htmlFor:"fieldAge",children:"Age"}),Object(O.jsxs)("div",{className:"input-group",children:[Object(O.jsx)("input",{name:"age",className:"form-control text-right",id:"fieldAge",disabled:!0,value:W({dateOfBirth:null===(r=n.patient)||void 0===r?void 0:r.dateOfBirth,error:null===(a=i.patient)||void 0===a?void 0:a.dateOfBirth})}),Object(O.jsx)("div",{className:"input-group-append",children:Object(O.jsx)("span",{className:"input-group-text",title:"years",children:"yr."})})]})]}),Object(O.jsxs)("div",{className:"form-group col-md-2 offset-md-1",children:[Object(O.jsx)("label",{htmlFor:"fieldEye",children:"Eye"}),Object(O.jsxs)(l.b,{as:"select",name:"patient.eye",className:"form-control",id:"fieldEye",children:[Object(O.jsx)("option",{value:"",children:"Select..."}),Object(O.jsx)("option",{value:"left",children:"Left"}),Object(O.jsx)("option",{value:"right",children:"Right"})]})]})]})]})},K=function(e){var t,c,r,a,i,n,l,s,o=e.errors,d=e.touched;return Object(O.jsxs)(O.Fragment,{children:[Object(O.jsx)("h4",{children:"Spectacle Refraction"}),Object(O.jsx)(w,{label:"Sphere",name:"spectacleRefraction.sphere",unit:"dpt",error:null===(t=o.spectacleRefraction)||void 0===t?void 0:t.sphere,touched:null===(c=d.spectacleRefraction)||void 0===c?void 0:c.sphere}),Object(O.jsx)(w,{label:"Cylindre",name:"spectacleRefraction.cylindre",unit:"dpt",error:null===(r=o.spectacleRefraction)||void 0===r?void 0:r.cylindre,touched:null===(a=d.spectacleRefraction)||void 0===a?void 0:a.cylindre}),Object(O.jsx)(w,{label:"Axis",name:"spectacleRefraction.axis",unit:"\xba",error:null===(i=o.spectacleRefraction)||void 0===i?void 0:i.axis,touched:null===(n=d.spectacleRefraction)||void 0===n?void 0:n.axis}),Object(O.jsx)(w,{label:"Vertex",name:"spectacleRefraction.vertex",unit:"mm",error:null===(l=o.spectacleRefraction)||void 0===l?void 0:l.vertex,touched:null===(s=d.spectacleRefraction)||void 0===s?void 0:s.vertex})]})},P=function(e){var t=e.errors,c=e.touched,r=e.values,a=Object(n.a)(e,["errors","touched","values"]);return Object(O.jsxs)(O.Fragment,{children:[Object(O.jsx)(J,Object(i.a)({values:r,errors:t,touched:c},a)),Object(O.jsx)("hr",{}),Object(O.jsxs)("div",{className:"form-row",children:[Object(O.jsx)("div",{className:"col-md-4",children:Object(O.jsx)(q,Object(i.a)({values:r,errors:t,touched:c},a))}),Object(O.jsx)("div",{className:"col-md-3 offset-md-1",children:Object(O.jsx)(K,Object(i.a)({values:r,errors:t,touched:c},a))}),Object(O.jsx)("div",{className:"col-md-3 offset-md-1",children:Object(O.jsx)(D,Object(i.a)({values:r,errors:t,touched:c},a))})]})]})},T=function(){return Object(O.jsx)(O.Fragment,{children:"Regression is coming soon..."})},V={patient:{name:"",dateOfBirth:"",eye:"left"},biometrics:{ata:0,wtw:0,clr:0,acq:0,acan:0,acat:0,kf:0,cct:0},spectacleRefraction:{sphere:0,cylindre:0,axis:0,vertex:0}},z=function(){var e=V;return Object(O.jsx)(l.c,{initialValues:e,validationSchema:p,onSubmit:function(){},children:function(e){var t=e.errors,c=e.touched,r=e.values,a=e.resetForm,l=Object(n.a)(e,["errors","touched","values","resetForm"]);return Object(O.jsxs)(O.Fragment,{children:[Object(O.jsx)("nav",{className:"navbar navbar-expand navbar-dark bg-dark fixed-top",children:Object(O.jsxs)("div",{className:"container",children:[Object(O.jsx)("a",{className:"navbar-brand",href:"/icl-calc",children:"ICL Size Calc"}),Object(O.jsx)("form",{className:"form-inline",children:Object(O.jsx)("button",{type:"button",className:"btn btn-danger",onClick:function(){a()},children:"Reset"})})]})}),Object(O.jsx)("div",{className:"container",children:Object(O.jsxs)(s.a,{basename:"/icl-calc",children:[Object(O.jsxs)("ul",{className:"nav nav-pills",style:{marginBottom:"1rem"},children:[Object(O.jsx)("li",{className:"nav-item",children:Object(O.jsx)(s.b,{exact:!0,className:"nav-link",activeClassName:"active",to:"/",children:"Patient"})}),Object(O.jsx)("li",{className:"nav-item",children:Object(O.jsx)(s.b,{exact:!0,className:"nav-link",activeClassName:"active",to:"/normality",children:"Biometric Normality"})}),Object(O.jsx)("li",{className:"nav-item",children:Object(O.jsx)(s.b,{exact:!0,className:"nav-link",activeClassName:"active",to:"/matrix",children:"Floating Matrix"})}),Object(O.jsx)("li",{className:"nav-item",children:Object(O.jsx)(s.b,{exact:!0,className:"nav-link",activeClassName:"active",to:"/regression",children:"Regression"})})]}),Object(O.jsx)("hr",{}),Object(O.jsxs)(o.c,{children:[Object(O.jsx)(o.a,{path:"/normality",children:Object(O.jsx)(g,{})}),Object(O.jsx)(o.a,{path:"/matrix",children:Object(O.jsx)(f,{})}),Object(O.jsx)(o.a,{path:"/regression",children:Object(O.jsx)(T,{})}),Object(O.jsx)(o.a,{path:"/",children:Object(O.jsx)(P,Object(i.a)({values:r,errors:t,touched:c},l))})]})]})})]})}})},G=function(){return Object(O.jsx)(z,{})};c(188);a.a.render(Object(O.jsx)(G,{}),document.getElementById("root"))}},[[189,1,2]]]);
//# sourceMappingURL=main.0cb1544f.chunk.js.map