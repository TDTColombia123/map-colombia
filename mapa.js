var mapa;
var country;
var address;
var marcador;
var mapaTorre;
var lastAddress;
var infoVentana;
var coberturaTorre;
var geolocalizador;
var visibilidadCoberturas;

function initialize() {  	
	// Se trae el país
	country = document.getElementById('countryName').value;
		
	// Construye un marcador estándar
	marcador = new google.maps.Marker({});
	
	// Crea un objeto con las características de las torres
	mapaTorre = [];	

	// Construye la ventana informativa
	infoVentana = new google.maps.InfoWindow({});

	// Crea un arreglo de coberturas
	coberturaTorre = new Array();

	// Construye el geo-localizador
	geolocalizador = new google.maps.Geocoder();
	
	// Asigna valor a la variable de visibilidad de coberturas
	visibilidadCoberturas = true;	
}

function procesoDatos(datos) {	
  // Se trae los datos del país
  var country_zoom = parseInt(extraeVariable (datos, "country_zoom"));
  var country_lat = parseFloat(extraeVariable (datos, "country_lat"));
  var country_lng = parseFloat(extraeVariable (datos, "country_lng"));    

	// Objeto con las características del mapa
	var opcionesMapa = {
		zoom: country_zoom,
		center: new google.maps.LatLng(country_lat, country_lng),
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};

	// Dibuja el mapa	
	mapa = new google.maps.Map(document.getElementById('map_canvas'),
		opcionesMapa);

	// Consulta la ubicación inicial
	address = extraeVariable (datos, "init_town");
	
	// Muestra la dirección
	document.getElementById('address').value = address;
	
	// Se obtienen los datos de las torres
	var n = datos.lastIndexOf("end_of_row");
	var total = parseInt(datos.slice(n+10));

	for (i=0; i<=total; i++) {
		
		var fila = datos.indexOf("row" + i);
		var fin  = datos.indexOf("end_of_row" + i);
		var registro = datos.slice(fila, fin);
		
		var lat = parseFloat(extraeVariable (registro, "lat"));
		var lng = parseFloat(extraeVariable (registro, "lng"));
		var zoom = parseInt(extraeVariable (registro, "zoom"));
		var radio = parseInt(extraeVariable (registro, "radio"));
		var icono = extraeVariable (registro, "icono");
		var titulo = extraeVariable (registro, "titulo");
		var canales = extraeVariable (registro, "canales");
		var fillColor = extraeVariable (registro, "fillColor");
		var polyCoords = extraeVariable (registro, "polyCoords");
		var strokeColor = extraeVariable (registro, "strokeColor");		
		var fillOpacity = parseFloat(extraeVariable (registro, "fillOpacity"));
		var strokeWeight = parseInt(extraeVariable (registro, "strokeWeight"));
		var strokeOpacity = parseFloat(extraeVariable (registro, "strokeOpacity"));

		// Establece un objeto para la torre
		mapaTorre[i] = {
			centro: 	new google.maps.LatLng(lat, lng),
			radio: 		radio,
			canales:	canales,
			circular: true
		};
		
		// Genera la cobertura
		if (polyCoords == '') {
		  coberturaTorre[i] = new google.maps.Circle({
				map: mapa,
				center: mapaTorre[i].centro,
				radius: radio,
				fillColor: fillColor,
				fillOpacity: fillOpacity,
				strokeColor: strokeColor,
				strokeWeight: strokeWeight,				
				strokeOpacity: strokeOpacity
  	  });
  	} else {
  	  // Consulta la región de cobertura
    	var num = polyCoords.lastIndexOf("end_of_lng");
			var end = parseInt(polyCoords.slice(num+10));

			var borde = new Array();
			
			for (j=0; j<=end; j++) {
				var x = parseFloat(extraeVariable (polyCoords, "lat" + j + "#"));
				var y = parseFloat(extraeVariable (polyCoords, "lng" + j + "#"));
				borde[j] = new google.maps.LatLng(x, y);
			};
				
			coberturaTorre[i] = new google.maps.Polygon({
				map: mapa,
				paths: borde,
				geodesic: true,
				fillColor: fillColor,
				fillOpacity: fillOpacity,
				strokeColor: strokeColor,
				strokeWeight: strokeWeight,				
				strokeOpacity: strokeOpacity
			});
			mapaTorre[i].circular = false;
		}
		
  	// Dibuja la torre  
  	var marcadorTorre = new google.maps.Marker({
			                 		position: mapaTorre[i].centro, 
			                 		map: mapa,
			                 		icon: icono,
			                 		title: titulo
  	});
  	
		// Asigna más propiedades a la torre
		marcadorTorre.set('contenido', "<h3>" + titulo + "</h3>");
		marcadorTorre.set('acercamiento', zoom);

		// Crea una ventana informativa para la torre
		var ventanaTorre = new google.maps.InfoWindow({});
	  
	  // Determina la acción al elegir la torre
		google.maps.event.addListener(marcadorTorre, 'click', function() {
			ventanaTorre.setContent(this.contenido);
			mapa.setZoom(this.acercamiento);		    
			mapa.setCenter(this.position);		    
			ventanaTorre.open(mapa, this);				
		});    	
	};
		  
	// Ubica el marcador estándar
	marcador.setMap(mapa);
	marcador.setPosition(mapa.center);
	marcador.setTitle(address);
	marcador.setDraggable(true);
	infoVentana.setContent("Arrastre este marcador a la ubicación deseada");

  // Establece la posición por defecto del marcador
  lastAddress = mapa.center;

	// Determina las acciones al elegir el marcador
	google.maps.event.addListener(marcador, 'click', function() {
		infoVentana.open(mapa, marcador);				
	}); 	

	google.maps.event.addListener(marcador, 'dragend', function() {
		void(document.getElementById('buttonProceso').value = 'Procesando...');
	  geolocalizador.geocode({'latLng': marcador.getPosition()}, 
	  function(results, status) {	getAddress (results, status); })
	});			
}

function extraeVariable(cadena, parametro)
{
	var pos1 = cadena.indexOf(parametro);
	var pos2 = cadena.indexOf("end_of_" + parametro);
	return cadena.slice(pos1 + parametro.length, pos2);
}

// Estima la cobertura
function cobertura (latLng, center, radius, polygon, flag) {
 if (flag == true) {
   return google.maps.geometry.spherical.computeDistanceBetween(center, latLng) <= radius;
 } else {   
   return polygon.containsLatLng(latLng);
 }
}

function ubicarAddress() {	
  // Asigna valor al indicador de procesamiento
  void(document.getElementById('buttonProceso').value = 'Procesando...');
  // Consulta la ubicación que desea el usuario
  address = document.getElementById('address').value;  
	// Mueve el mapa a la ubicación deseada    
  geolocalizador.geocode( {'address': address + ', ' + country}, 
    function(results, status) {	
    	getAddress (results, status);
    	mapa.setZoom(10); } );
}

// Ubica la dirección
function getAddress (resultados, estado) {
  // Averigua el estado
	if (estado == google.maps.GeocoderStatus.OK) {
		// Obtiene la ubicación
		var lugar = resultados[0].formatted_address;
		var punto = resultados[0].geometry.location;
		// Reubica el marcador estándar
		mapa.setCenter(punto);				
		marcador.setPosition(punto);
		marcador.setTitle(lugar);
		// Reestablece la posición por defecto del marcador
		lastAddress = punto;
		// Ubica la torre más cercana
		var infoInicio = "<p>En " + lugar + " se puede ver:</p>";
		var frecuencias = [];
		var contador_frecuencias = 0;
		infoVentana.setContent(infoInicio);
		for (i in mapaTorre)
		{
			var centro 		= mapaTorre[i].centro; 
			var radio  		= mapaTorre[i].radio;
			if (cobertura(punto, centro, radio, coberturaTorre[i], mapaTorre[i].circular)) {
				// Incluye los canales de cobertura
    		var num = mapaTorre[i].canales.lastIndexOf("end_of_frequency");
				var end = parseInt(mapaTorre[i].canales.slice(num+16));

				for (j=0; j<=end; j++) {
					frecuencias[contador_frecuencias] = 
						[extraeVariable (mapaTorre[i].canales, "station" + j), 
						 parseInt(extraeVariable (mapaTorre[i].canales, "frequency" + j))
						];
					contador_frecuencias++;
				};
			}
		};
		
		frecuencias.sort(function(a, b)
		{
		if(a[1] === b[1])
			{
				var x = a[0].toLowerCase(), y = b[0].toLowerCase();
				return x < y ? -1 : x > y ? 1 : 0;
			}
			return a[1] - b[1];
		});
		
		for (i in frecuencias)
		{
			var contenido =	infoVentana.getContent();
			var señal = "<li><b>" + frecuencias[i][0] + "</b>: " + frecuencias[i][1] + " MHz</li>";
			if (contenido.indexOf(señal) < 0) {
				infoVentana.setContent(contenido + señal);
			}
		};
		if (infoVentana.getContent() == infoInicio) {
				infoVentana.setContent(lugar + ":<p><h4>Sin cobertura</h4></p>");
		}
		// Muestra la ventana informativa
		infoVentana.open(mapa, marcador);
	}	else {
		alert("No se pudo ubicar la dirección");
		// Reubica el marcador estándar
		mapa.setCenter(lastAddress);				
		marcador.setPosition(lastAddress);
	}
	// Confirma la dirección
	$('#address').val(lugar);
	// Limpia el indicador de procesamiento
	void(document.getElementById('buttonProceso').value = ' ');
}

// Dibuja la cobertura
function mostrarCobertura() {
	if (visibilidadCoberturas == false) {
  	for (var torre in coberturaTorre) {	coberturaTorre[torre].setVisible(true); }
		void(document.getElementById('buttonMostrar').value = 'Ocultar coberturas');
		visibilidadCoberturas = true;
	} else {
  	for (var torre in coberturaTorre) {	coberturaTorre[torre].setVisible(false); }
		void(document.getElementById('buttonMostrar').value = 'Mostrar coberturas');
		visibilidadCoberturas = false;
  }
}

$(document).ready(function() {
	initialize();
	// Se trae la información de las antenas
	$.get("/maps/files/solicitud.php", {country:country}, procesoDatos);	
	// Procedimiento para mostrar la cobertura
	$('#buttonMostrar').bind('click', mostrarCobertura);
	// Activa una petición de geolocalización cuando se presiona 
	// el botón de ubicación de dirección
	$('#buttonUbicar').bind('click', ubicarAddress);	
	// Activa una petición de geolocalización cuando se presiona 
	// enter en el campo de dirección "address"
	$('#address').bind('keydown', function(event) {
		if(event.keyCode == 13) {
  		ubicarAddress();
		}
	});
});

