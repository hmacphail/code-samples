var numTeams = 0;

function onLoad()
{
  var xmlhttp;
  if (window.XMLHttpRequest) // code for IE7+, Firefox, Chrome, Opera, Safari
  {
    xmlhttp=new XMLHttpRequest();
  }
  else // code for IE6, IE5
  {
    xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
  }

  xmlhttp.open("GET","teams.xml",false);
  xmlhttp.send();
  var xmlDoc=xmlhttp.responseXML; 

  var listText = "";
  var mainText = "";

  var tabToLoad = 0;
  var hash = window.location.hash.substr(1);

  // PARSE THROUGH EACH TEAM WITHIN XML DOCUMENT
  var teams=xmlDoc.getElementsByTagName("team");
  numTeams = teams.length;
  for (var ii=0; ii < numTeams; ii++)
  {
    var teamname = (teams[ii].getElementsByTagName("teamname")[0].childNodes[0] == undefined) ? 
      "" :
      teams[ii].getElementsByTagName("teamname")[0].childNodes[0].nodeValue;

    var description = (teams[ii].getElementsByTagName("description")[0].childNodes[0] == undefined) ? 
      "" :
      teams[ii].getElementsByTagName("description")[0].childNodes[0].nodeValue;

    var logourl = (teams[ii].getElementsByTagName("logourl")[0].childNodes[0] == undefined) ? 
      "" :
      teams[ii].getElementsByTagName("logourl")[0].childNodes[0].nodeValue;

    var siteurl = (teams[ii].getElementsByTagName("siteurl")[0].childNodes[0] == undefined) ? 
      "" :
      teams[ii].getElementsByTagName("siteurl")[0].childNodes[0].nodeValue;

    /*var backgroundimage = (teams[ii].getElementsByTagName("backgroundimage")[0].childNodes[0] == undefined) ? 
      "" :
      teams[ii].getElementsByTagName("backgroundimage")[0].childNodes[0].nodeValue;
    */
    // LIST ELEMENTS FOR NAV BAR
    listText += "<a id='team-a-" + ii + "' href='#" + teamname.toLowerCase() + "' onclick='javascript:showTab(" + ii + ");'>" + teamname + "</a>";

    // SECTION WITH TEAM INFO
    mainText += "<div id='div-main-" + ii + "'>";
    mainText += "<a href='" + siteurl + "'><img src='" + logourl + "'></a>";
    mainText += "<br/><br/>";
    mainText += description;
    mainText += "</div>";

    if (hash == teamname.toLowerCase()) {
      tabToLoad = ii;
    }
  }
  
  document.getElementById('panel-navigation-header').innerHTML = listText;
  document.getElementById('panel-navigation-content').innerHTML = mainText;

  showTab(tabToLoad);
}

function showTab(tabid)
{
  for (var ii=0; ii < numTeams; ii++)
  {
    document.getElementById("team-a-" + ii).className = "";
    document.getElementById("div-main-" + ii).className = "hide";
  }

  document.getElementById("team-a-" + tabid).className = "current";
  document.getElementById("div-main-" + tabid).className = "";
}
