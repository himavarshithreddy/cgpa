

function result(){
    var c1=parseInt(document.getElementById("cor1").value);
    var g1=parseInt(document.getElementById("grade1").value);
   var c2=parseInt(document.getElementById("cor2").value);
   var g2=parseInt(document.getElementById("grade2").value);
   var c3=parseInt(document.getElementById("cor3").value);
   var g3=parseInt(document.getElementById("grade3").value);
   var c4=parseInt(document.getElementById("cor4").value);
   var g4=parseInt(document.getElementById("grade4").value);
   var c5=parseInt(document.getElementById("cor5").value);
   var g5=parseInt(document.getElementById("grade5").value);
   var c6=parseInt(document.getElementById("cor6").value);
   var g6=parseInt(document.getElementById("grade6").value);
   var c7=parseInt(document.getElementById("cor7").value);
   var g7=parseInt(document.getElementById("grade7").value);
   var c8=parseInt(document.getElementById("cor8").value);
   var g8=parseInt(document.getElementById("grade8").value);
   var c9=parseInt(document.getElementById("cor9").value);
   var g9=parseInt(document.getElementById("grade9").value);

   var num=c1*g1 + c2*g2 + c3*g3 + c4*g4 + c5*g5 + c6*g6 + c7*g7 + c8*g8 +c9*g9;
   var den=c1+c2+c3+c4+c5+c6+c7+c8+c9;
   var cgpa=num/den;
   cgpa = cgpa.toFixed(2);
   
   
   document.getElementById("cgpa").innerHTML = cgpa;
   cgpa=parseFloat(cgpa);
   if(cgpa>=9)
   document.getElementById("cele").style.display="flex";
   else
    document.getElementById("cele").style.display="none";
};
