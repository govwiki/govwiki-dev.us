(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var add_marker, bounds_timeout, clear, create_info_window, geocode, geocode_addr, get_icon, get_records, get_records2, map, on_bounds_changed, on_bounds_changed_later, pinImage, rebuild_filter,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

bounds_timeout = void 0;

map = new GMaps({
  el: '#govmap',
  lat: 37.3,
  lng: -119.3,
  zoom: 6,
  minZoom: 6,
  scrollwheel: true,
  panControl: false,
  zoomControl: true,
  zoomControlOptions: {
    style: google.maps.ZoomControlStyle.SMALL
  },
  bounds_changed: function() {
    return on_bounds_changed_later(200);
  }
});

map.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(document.getElementById('legend'));

$(function() {
  $('#legend li:not(.counties-trigger)').on('click', function() {
    var hidden_field, value;
    $(this).toggleClass('active');
    hidden_field = $(this).find('input');
    value = hidden_field.val();
    hidden_field.val(value === '1' ? '0' : '1');
    return rebuild_filter();
  });
  return $('#legend li.counties-trigger').on('click', function() {
    $(this).toggleClass('active');
    if ($(this).hasClass('active')) {
      return GOVWIKI.get_counties(GOVWIKI.draw_polygons);
    } else {
      return map.removePolygons();
    }
  });
});

rebuild_filter = function() {
  var hard_params;
  hard_params = ['City', 'School District', 'Special District'];
  GOVWIKI.gov_type_filter_2 = [];
  $('.type_filter').each(function(index, element) {
    var ref;
    if ((ref = $(element).attr('name'), indexOf.call(hard_params, ref) >= 0) && $(element).val() === '1') {
      return GOVWIKI.gov_type_filter_2.push($(element).attr('name'));
    }
  });
  return on_bounds_changed_later(350);
};

on_bounds_changed_later = function(msec) {
  clearTimeout(bounds_timeout);
  return bounds_timeout = setTimeout(on_bounds_changed, msec);
};

on_bounds_changed = function(e) {
  var additional_filter, b, first, gov_type, gtf, i, len, ne, ne_lat, ne_lng, q2, st, sw, sw_lat, sw_lng, ty, url_value;
  console.log("bounds_changed");
  b = map.getBounds();
  url_value = b.toUrlValue();
  ne = b.getNorthEast();
  sw = b.getSouthWest();
  ne_lat = ne.lat();
  ne_lng = ne.lng();
  sw_lat = sw.lat();
  sw_lng = sw.lng();
  st = GOVWIKI.state_filter;
  ty = GOVWIKI.gov_type_filter;
  gtf = GOVWIKI.gov_type_filter_2;

  /*
   * Build the query.
  q=""" "latitude":{"$lt":#{ne_lat},"$gt":#{sw_lat}},"longitude":{"$lt":#{ne_lng},"$gt":#{sw_lng}}"""
   * Add filters if they exist
  q+=""","state":"#{st}" """ if st
  q+=""","gov_type":"#{ty}" """ if ty
  
  
  get_records q, 200,  (data) ->
    #console.log "length=#{data.length}"
    #console.log "lat: #{ne_lat},#{sw_lat} lng: #{ne_lng}, #{sw_lng}"
    map.removeMarkers()
    add_marker(rec) for rec in data
    return
   */
  q2 = " latitude<" + ne_lat + " AND latitude>" + sw_lat + " AND longitude<" + ne_lng + " AND longitude>" + sw_lng + " AND alt_type!=\"County\" ";
  if (st) {
    q2 += " AND state=\"" + st + "\" ";
  }
  if (ty) {
    q2 += " AND gov_type=\"" + ty + "\" ";
  }
  if (gtf.length > 0) {
    first = true;
    additional_filter = " AND (";
    for (i = 0, len = gtf.length; i < len; i++) {
      gov_type = gtf[i];
      if (!first) {
        additional_filter += " OR";
      }
      additional_filter += " alt_type=\"" + gov_type + "\" ";
      first = false;
    }
    additional_filter += ")";
    q2 += additional_filter;
  } else {
    q2 += " AND alt_type!=\"City\" AND alt_type!=\"School District\" AND alt_type!=\"Special District\" ";
  }
  return get_records2(q2, 200, function(data) {
    var j, len1, rec, ref;
    map.removeMarkers();
    ref = data.record;
    for (j = 0, len1 = ref.length; j < len1; j++) {
      rec = ref[j];
      add_marker(rec);
    }
  });
};

get_icon = function(gov_type) {
  var _circle;
  _circle = function(color) {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillOpacity: 1,
      fillColor: color,
      strokeWeight: 1,
      strokeColor: 'white',
      scale: 6
    };
  };
  switch (gov_type) {
    case 'General Purpose':
      return _circle('red');
    case 'School District':
      return _circle('lightblue');
    case 'Dependent School System':
      return _circle('lightblue');
    default:
      return _circle('purple');
  }
};

add_marker = function(rec) {
  map.addMarker({
    lat: rec.latitude,
    lng: rec.longitude,
    icon: get_icon(rec.gov_type),
    title: rec.gov_name + ", " + rec.gov_type,
    infoWindow: {
      content: create_info_window(rec)
    },
    click: function(e) {
      return window.GOVWIKI.show_record2(rec);
    }
  });
};

create_info_window = function(r) {
  var w;
  w = $('<div></div>').append($("<a href='#'><strong>" + r.gov_name + "</strong></a>").click(function(e) {
    e.preventDefault();
    console.log(r);
    return window.GOVWIKI.show_record2(r);
  })).append($("<div> " + r.gov_type + "  " + r.city + " " + r.zip + " " + r.state + "</div>"));
  return w[0];
};

get_records = function(query, limit, onsuccess) {
  return $.ajax({
    url: "https://api.mongolab.com/api/1/databases/govwiki/collections/govs/?q={" + query + "}&f={_id:0}&l=" + limit + "&s={rand:1}&apiKey=0Y5X_Qk2uOJRdHJWJKSRWk6l6JqVTS2y",
    dataType: 'json',
    cache: true,
    success: onsuccess,
    error: function(e) {
      return console.log(e);
    }
  });
};

get_records2 = function(query, limit, onsuccess) {
  return $.ajax({
    url: "http://46.101.3.79:80/rest/db/govs",
    data: {
      filter: query,
      fields: "_id,inc_id,gov_name,gov_type,city,zip,state,latitude,longitude,alt_name",
      app_name: "govwiki",
      order: "rand",
      limit: limit
    },
    dataType: 'json',
    cache: true,
    success: onsuccess,
    error: function(e) {
      return console.log(e);
    }
  });
};

pinImage = new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=Z|7777BB|FFFFFF', new google.maps.Size(21, 34), new google.maps.Point(0, 0), new google.maps.Point(10, 34));

geocode_addr = function(addr, data) {
  return GMaps.geocode({
    address: addr,
    callback: function(results, status) {
      var latlng;
      if (status === 'OK') {
        latlng = results[0].geometry.location;
        map.setCenter(latlng.lat(), latlng.lng());
        map.addMarker({
          lat: latlng.lat(),
          lng: latlng.lng(),
          size: 'small',
          title: results[0].formatted_address,
          infoWindow: {
            content: results[0].formatted_address
          }
        });
        if (data) {
          map.addMarker({
            lat: data.latitude,
            lng: data.longitude,
            size: 'small',
            color: 'blue',
            icon: pinImage,
            title: data.latitude + " " + data.longitude,
            infoWindow: {
              content: data.latitude + " " + data.longitude
            }
          });
        }
        $('.govmap-found').html("<strong>FOUND: </strong>" + results[0].formatted_address);
      }
    }
  });
};

clear = function(s) {
  if (s.match(/ box /i)) {
    return '';
  } else {
    return s;
  }
};

geocode = function(data) {
  var addr;
  addr = (clear(data.address1)) + " " + (clear(data.address2)) + ", " + data.city + ", " + data.state + " " + data.zip + ", USA";
  $('#govaddress').val(addr);
  return geocode_addr(addr, data);
};

module.exports = {
  geocode: geocode,
  gocode_addr: geocode_addr,
  on_bounds_changed: on_bounds_changed,
  on_bounds_changed_later: on_bounds_changed_later,
  map: map
};


},{}],2:[function(require,module,exports){
var GovSelector, query_matcher,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

query_matcher = require('./querymatcher.coffee');

GovSelector = (function() {
  var entered_value, govs_array;

  GovSelector.prototype.on_selected = function(evt, data, name) {};

  function GovSelector(html_selector, docs_url, num_items) {
    this.html_selector = html_selector;
    this.num_items = num_items;
    this.startSuggestion = bind(this.startSuggestion, this);
    $.ajax({
      url: docs_url,
      dataType: 'json',
      cache: true,
      success: this.startSuggestion
    });
  }

  GovSelector.prototype.suggestionTemplate = Handlebars.compile("<div class=\"sugg-box\">\n  <div class=\"sugg-state\">{{{state}}}</div>\n  <div class=\"sugg-name\">{{{gov_name}}}</div>\n  <div class=\"sugg-type\">{{{gov_type}}}</div>\n</div>");

  entered_value = "";

  govs_array = [];

  GovSelector.prototype.count_govs = function() {
    var count, d, i, len, ref;
    count = 0;
    ref = this.govs_array;
    for (i = 0, len = ref.length; i < len; i++) {
      d = ref[i];
      if (GOVWIKI.state_filter && d.state !== GOVWIKI.state_filter) {
        continue;
      }
      if (GOVWIKI.gov_type_filter && d.gov_type !== GOVWIKI.gov_type_filter) {
        continue;
      }
      count++;
    }
    return count;
  };

  GovSelector.prototype.startSuggestion = function(govs) {
    this.govs_array = govs.record;
    $('.typeahead').keyup((function(_this) {
      return function(event) {
        return _this.entered_value = $(event.target).val();
      };
    })(this));
    $(this.html_selector).attr('placeholder', 'GOVERNMENT NAME');
    $(this.html_selector).typeahead({
      hint: false,
      highlight: false,
      minLength: 1,
      classNames: {
        menu: 'tt-dropdown-menu'
      }
    }, {
      name: 'gov_name',
      displayKey: 'gov_name',
      source: query_matcher(this.govs_array, this.num_items),
      templates: {
        suggestion: this.suggestionTemplate
      }
    }).on('typeahead:selected', (function(_this) {
      return function(evt, data, name) {
        $('.typeahead').typeahead('val', _this.entered_value);
        return _this.on_selected(evt, data, name);
      };
    })(this)).on('typeahead:cursorchanged', (function(_this) {
      return function(evt, data, name) {
        return $('.typeahead').val(_this.entered_value);
      };
    })(this));
  };

  return GovSelector;

})();

module.exports = GovSelector;


},{"./querymatcher.coffee":4}],3:[function(require,module,exports){

/*
file: main.coffe -- The entry -----------------------------------------------------------------------------------
  :
gov_finder = new GovFinder
gov_details = new GovDetails
gov_finder.on_select = gov_details.show
-----------------------------------------------------------------------------------------------------------------
 */
var GovSelector, Templates2, activate_tab, active_tab, adjust_typeahead_width, build_select_element, build_selector, draw_polygons, focus_search_field, get_counties, get_elected_officials, get_financial_statements, get_max_ranks, get_record, get_record2, gov_selector, govmap, livereload, reset, router, start_adjusting_typeahead_width, templates;

GovSelector = require('./govselector.coffee');

Templates2 = require('./templates2.coffee');

govmap = require('./govmap.coffee');

window.GOVWIKI = {
  state_filter: '',
  gov_type_filter: '',
  gov_type_filter_2: ['City', 'School District', 'Special District'],
  show_search_page: function() {
    $(window).scrollTo('0px', 10);
    $('#dataContainer').hide();
    $('#searchIcon').hide();
    $('#searchContainer').fadeIn(300);
    return focus_search_field(500);
  },
  show_data_page: function() {
    $(window).scrollTo('0px', 10);
    $('#searchIcon').show();
    $('#dataContainer').fadeIn(300);
    return $('#searchContainer').hide();
  }
};

gov_selector = new GovSelector('.typeahead', 'data/h_types_ca.json', 7);

templates = new Templates2;

active_tab = "";

$.get("texts/intro-text.html", function(data) {
  return $("#intro-text").html(data);
});

GOVWIKI.get_counties = get_counties = function(callback) {
  return $.ajax({
    url: 'data/county_geography_ca.json',
    dataType: 'json',
    cache: true,
    success: function(countiesJSON) {
      return callback(countiesJSON);
    }
  });
};

GOVWIKI.draw_polygons = draw_polygons = function(countiesJSON) {
  var county, i, len, ref, results;
  ref = countiesJSON.features;
  results = [];
  for (i = 0, len = ref.length; i < len; i++) {
    county = ref[i];
    results.push(govmap.map.drawPolygon({
      paths: county.geometry.coordinates,
      useGeoJSON: true,
      strokeColor: '#808080',
      strokeOpacity: 0.6,
      strokeWeight: 1.5,
      fillColor: '#FF0000',
      fillOpacity: 0.15,
      countyId: county.properties._id,
      altName: county.properties.alt_name,
      marker: new MarkerWithLabel({
        position: new google.maps.LatLng(0, 0),
        draggable: false,
        raiseOnDrag: false,
        map: govmap.map.map,
        labelContent: county.properties.name,
        labelAnchor: new google.maps.Point(-15, 25),
        labelClass: "label-tooltip",
        labelStyle: {
          opacity: 1.0
        },
        icon: "http://placehold.it/1x1",
        visible: false
      }),
      mouseover: function() {
        return this.setOptions({
          fillColor: "#00FF00"
        });
      },
      mousemove: function(event) {
        this.marker.setPosition(event.latLng);
        return this.marker.setVisible(true);
      },
      mouseout: function() {
        this.setOptions({
          fillColor: "#FF0000"
        });
        return this.marker.setVisible(false);
      },
      click: function() {
        return router.navigate("" + this.countyId);
      }
    }));
  }
  return results;
};

get_counties(draw_polygons);

window.remember_tab = function(name) {
  return active_tab = name;
};

$(document).on('click', '#fieldTabs a', function(e) {
  var finValWidthMax1, finValWidthMax2, finValWidthMax3;
  active_tab = $(e.currentTarget).data('tabname');
  console.log(active_tab);
  $("#tabsContent .tab-pane").removeClass("active");
  $($(e.currentTarget).attr('href')).addClass("active");
  templates.activate(0, active_tab);
  if (active_tab === 'Financial Statements') {
    finValWidthMax1 = 0;
    finValWidthMax2 = 0;
    finValWidthMax3 = 0;
    $('.fin-values-block [data-col="1"]').find('.fin-val').each(function() {
      var thisFinValWidth;
      thisFinValWidth = $(this).width();
      if (thisFinValWidth > finValWidthMax1) {
        return finValWidthMax1 = thisFinValWidth;
      }
    });
    $('.fin-values-block [data-col="2"]').find('.fin-val').each(function() {
      var thisFinValWidth;
      thisFinValWidth = $(this).width();
      if (thisFinValWidth > finValWidthMax2) {
        return finValWidthMax2 = thisFinValWidth;
      }
    });
    $('.fin-values-block [data-col="3"]').find('.fin-val').each(function() {
      var thisFinValWidth;
      thisFinValWidth = $(this).width();
      if (thisFinValWidth > finValWidthMax3) {
        return finValWidthMax3 = thisFinValWidth;
      }
    });
    $('.fin-values-block [data-col="1"] .currency-sign').css('right', finValWidthMax1 + 27);
    $('.fin-values-block [data-col="2"] .currency-sign').css('right', finValWidthMax2 + 27);
    return $('.fin-values-block [data-col="3"] .currency-sign').css('right', finValWidthMax3 + 27);
  }
});

$(document).tooltip({
  selector: "[class='media-tooltip']",
  trigger: 'click'
});

activate_tab = function() {
  return $("#fieldTabs a[href='#tab" + active_tab + "']").tab('show');
};

gov_selector.on_selected = function(evt, data, name) {
  return get_elected_officials(data._id, 25, function(data2, textStatus, jqXHR) {
    data.elected_officials = data2;
    $('#details').html(templates.get_html(0, data));
    get_record2(data["_id"]);
    activate_tab();
    GOVWIKI.show_data_page();
    router.navigate("" + data._id);
  });
};

get_record = function(query) {
  return $.ajax({
    url: "https://api.mongolab.com/api/1/databases/govwiki/collections/govs/?q={" + query + "}&f={_id:0}&l=1&apiKey=0Y5X_Qk2uOJRdHJWJKSRWk6l6JqVTS2y",
    dataType: 'json',
    cache: true,
    success: function(data) {
      if (data.length) {
        $('#details').html(templates.get_html(0, data[0]));
        activate_tab();
      }
    },
    error: function(e) {
      return console.log(e);
    }
  });
};

get_record2 = function(recid) {
  return $.ajax({
    url: "http://46.101.3.79:80/rest/db/govs/" + recid,
    dataType: 'json',
    headers: {
      "X-DreamFactory-Application-Name": "govwiki"
    },
    cache: true,
    success: function(data) {
      if (data) {
        get_financial_statements(data._id, function(data2, textStatus, jqXHR) {
          data.financial_statements = data2;
          return get_elected_officials(data._id, 25, function(data3, textStatus2, jqXHR2) {
            data.elected_officials = data3;
            return get_max_ranks(function(max_ranks_response) {
              data.max_ranks = max_ranks_response.record[0];
              $('#details').html(templates.get_html(0, data));
              return activate_tab();
            });
          });
        });
      }
    },
    error: function(e) {
      return console.log(e);
    }
  });
};

get_elected_officials = function(gov_id, limit, onsuccess) {
  return $.ajax({
    url: "http://46.101.3.79:80/rest/db/elected_officials",
    data: {
      filter: "govs_id=" + gov_id,
      fields: "govs_id,title,full_name,email_address,photo_url,term_expires,telephone_number",
      app_name: "govwiki",
      order: "display_order",
      limit: limit
    },
    dataType: 'json',
    cache: true,
    success: onsuccess,
    error: function(e) {
      return console.log(e);
    }
  });
};

get_financial_statements = function(gov_id, onsuccess) {
  return $.ajax({
    url: "http://46.101.3.79:80/rest/db/_proc/get_financial_statements",
    data: {
      app_name: "govwiki",
      order: "caption_category,display_order",
      params: [
        {
          name: "govs_id",
          param_type: "IN",
          value: gov_id
        }
      ]
    },
    dataType: 'json',
    cache: true,
    success: onsuccess,
    error: function(e) {
      return console.log(e);
    }
  });
};

get_max_ranks = function(onsuccess) {
  return $.ajax({
    url: 'http://46.101.3.79:80/rest/db/max_ranks',
    data: {
      app_name: 'govwiki'
    },
    dataType: 'json',
    cache: true,
    success: onsuccess
  });
};

window.GOVWIKI.show_record = (function(_this) {
  return function(rec) {
    $('#details').html(templates.get_html(0, rec));
    activate_tab();
    GOVWIKI.show_data_page();
    return router.navigate(rec._id);
  };
})(this);

window.GOVWIKI.show_record2 = (function(_this) {
  return function(rec) {
    return get_elected_officials(rec._id, 25, function(data, textStatus, jqXHR) {
      rec.elected_officials = data;
      $('#details').html(templates.get_html(0, rec));
      get_record2(rec._id);
      activate_tab();
      GOVWIKI.show_data_page();
      return router.navigate("" + (rec.alt_name.replace(/ /g, '_')));
    });
  };
})(this);


/*
window.show_rec = (rec)->
  $('#details').html templates.get_html(0, rec)
  activate_tab()
 */

build_selector = function(container, text, command, where_to_store_value) {
  return $.ajax({
    url: 'https://api.mongolab.com/api/1/databases/govwiki/runCommand?apiKey=0Y5X_Qk2uOJRdHJWJKSRWk6l6JqVTS2y',
    type: 'POST',
    contentType: "application/json",
    dataType: 'json',
    data: command,
    cache: true,
    success: (function(_this) {
      return function(data) {
        var values;
        values = data.values;
        build_select_element(container, text, values.sort(), where_to_store_value);
      };
    })(this),
    error: function(e) {
      return console.log(e);
    }
  });
};

build_select_element = function(container, text, arr, where_to_store_value) {
  var i, len, s, select, v;
  s = "<select class='form-control' style='maxwidth:160px;'><option value=''>" + text + "</option>";
  for (i = 0, len = arr.length; i < len; i++) {
    v = arr[i];
    if (v) {
      s += "<option value='" + v + "'>" + v + "</option>";
    }
  }
  s += "</select>";
  select = $(s);
  $(container).append(select);
  if (text === 'State..') {
    select.val('CA');
    window.GOVWIKI.state_filter = 'CA';
    govmap.on_bounds_changed_later();
  }
  return select.change(function(e) {
    var el;
    el = $(e.target);
    window.GOVWIKI[where_to_store_value] = el.val();
    $('.gov-counter').text(gov_selector.count_govs());
    return govmap.on_bounds_changed();
  });
};

adjust_typeahead_width = function() {
  var inp, par;
  inp = $('#myinput');
  par = $('#typeahed-container');
  return inp.width(par.width());
};

start_adjusting_typeahead_width = function() {
  return $(window).resize(function() {
    return adjust_typeahead_width();
  });
};

livereload = function(port) {
  var url;
  url = window.location.origin.replace(/:[^:]*$/, "");
  return $.getScript(url + ":" + port, (function(_this) {
    return function() {
      return $('body').append("<div style='position:absolute;z-index:1000;\nwidth:100%; top:0;color:red; text-align: center;\npadding:1px;font-size:10px;line-height:1'>live</div>");
    };
  })(this));
};

focus_search_field = function(msec) {
  return setTimeout((function() {
    return $('#myinput').focus();
  }), msec);
};

window.onhashchange = function(e) {
  var h;
  h = window.location.hash;
  if (!h) {
    return GOVWIKI.show_search_page();
  }
};

router = new Grapnel;

router.get(':id/:user_id', function(req, event) {
  var gov_id, user_id;
  gov_id = req.params.id.substr(0);
  user_id = req.params.user_id;
  templates.load_fusion_template("tabs", "https://www.googleapis.com/fusiontables/v2/query?sql=SELECT%20*%20FROM%201z2oXQEYQ3p2OoMI8V5gKgHWB5Tz990BrQ1xc1tVo&key=AIzaSyCXDQyMDpGA2g3Qjuv4CDv7zRj-ix4IQJA");
  return $.ajax({
    url: "http://46.101.3.79:80/rest/db/govs",
    data: {
      filter: "_id=" + gov_id,
      fields: "gov_name",
      app_name: "govwiki"
    },
    success: function(data) {
      var gov_name;
      gov_name = data.record[0].gov_name;
      return (function(_this) {
        return function() {
          return $.ajax({
            url: "http://46.101.3.79:80/rest/db/_proc/getVotes?app_name=govwiki",
            data: {
              app_name: "govwiki",
              params: [
                {
                  "name": "id",
                  "param_type": "INT",
                  "value": user_id,
                  "type": "json",
                  "length": 0
                }
              ]
            },
            dataType: 'json',
            success: function(data) {
              var votes;
              votes = data;
              return (function(_this) {
                return function(gov_name, votes) {
                  return $.ajax({
                    url: "http://46.101.3.79:80/rest/db/elected_officials",
                    data: {
                      filter: "elected_official_id=" + user_id,
                      app_name: "govwiki",
                      limit: 25
                    },
                    dataType: 'json',
                    cache: true,
                    success: function(data) {
                      var compiledTemplate, html, person, tpl;
                      person = data.record[0];
                      person.gov_name = gov_name;
                      person.votes = votes;
                      console.log(person);
                      tpl = $('#person-info-template').html();
                      compiledTemplate = Handlebars.compile(tpl);
                      html = compiledTemplate(person);
                      $('#searchContainer').html(html);
                      return $('.vote').on('click', function(e) {
                        var id;
                        id = e.currentTarget.id;
                        $('#conversation').modal('show');
                        return reset(id, 'http://govwiki.us' + '/' + id, id);
                      });
                    },
                    error: function(e) {
                      return console.log(e);
                    }
                  });
                };
              })(this)(gov_name, votes);
            }
          });
        };
      })(this)();
    }
  });
});

reset = function(newIdentifier, newUrl, newTitle) {
  return DISQUS.reset({
    reload: true,
    config: function() {
      this.page.identifier = newIdentifier;
      this.page.url = newUrl;
      return this.page.title = newTitle;
    }
  });
};

router.get(':id', function(req, event) {
  var build_data, elected_officials, id;
  id = req.params.id;
  templates.load_fusion_template("tabs", "https://www.googleapis.com/fusiontables/v2/query?sql=SELECT%20*%20FROM%201z2oXQEYQ3p2OoMI8V5gKgHWB5Tz990BrQ1xc1tVo&key=AIzaSyCXDQyMDpGA2g3Qjuv4CDv7zRj-ix4IQJA");
  console.log("ROUTER ID=" + id);
  get_elected_officials = function(gov_id, limit, onsuccess) {
    return $.ajax({
      url: "http://46.101.3.79:80/rest/db/elected_officials",
      data: {
        filter: "govs_id=" + gov_id,
        app_name: "govwiki",
        order: "display_order",
        limit: limit
      },
      dataType: 'json',
      cache: true,
      success: onsuccess,
      error: function(e) {
        return console.log(e);
      }
    });
  };
  if (isNaN(id)) {
    id = id.replace(/_/g, ' ');
    build_data = function(id, limit, onsuccess) {
      return $.ajax({
        url: "http://46.101.3.79:80/rest/db/govs",
        data: {
          filter: "alt_name='" + id + "'",
          app_name: "govwiki"
        },
        dataType: 'json',
        cache: true,
        success: function(data) {
          var elected_officials;
          return elected_officials = get_elected_officials(data.record[0]._id, 25, function(elected_officials_data, textStatus, jqXHR) {
            var gov_id;
            gov_id = data.record[0]._id;
            data = new Object();
            data._id = gov_id;
            data.elected_officials = elected_officials_data;
            data.gov_name = "";
            data.gov_type = "";
            data.state = "";
            $('#details').html(templates.get_html(0, data));
            get_record2(data._id);
            activate_tab();
            GOVWIKI.show_data_page();
          });
        },
        error: function(e) {
          return console.log(e);
        }
      });
    };
    return build_data(id);
  } else {
    return elected_officials = get_elected_officials(id, 25, function(elected_officials_data, textStatus, jqXHR) {
      var data;
      data = new Object();
      data._id = id;
      data.elected_officials = elected_officials_data;
      data.gov_name = "";
      data.gov_type = "";
      data.state = "";
      $('#details').html(templates.get_html(0, data));
      get_record2(data._id);
      activate_tab();
      GOVWIKI.show_data_page();
    });
  }
});

router.get('', function(req, event) {
  return templates.load_fusion_template("tabs", "https://www.googleapis.com/fusiontables/v2/query?sql=SELECT%20*%20FROM%201z2oXQEYQ3p2OoMI8V5gKgHWB5Tz990BrQ1xc1tVo&key=AIzaSyCXDQyMDpGA2g3Qjuv4CDv7zRj-ix4IQJA");
});

build_selector('.state-container', 'State..', '{"distinct": "govs","key":"state"}', 'state_filter');

build_selector('.gov-type-container', 'type of government..', '{"distinct": "govs","key":"gov_type"}', 'gov_type_filter');

adjust_typeahead_width();

start_adjusting_typeahead_width();

$('#btnBackToSearch').click(function(e) {
  e.preventDefault();
  return GOVWIKI.show_search_page();
});

livereload("9090");


},{"./govmap.coffee":1,"./govselector.coffee":2,"./templates2.coffee":5}],4:[function(require,module,exports){
var QueryMather, full_trim, get_words, get_words_regs, select_text, strip, strongify;

QueryMather = function(docs, num_items) {
  if (num_items == null) {
    num_items = 5;
  }
  return function(q, cb) {
    var d, j, len, matches, ref, regs, test_string, words;
    test_string = function(s, regs) {
      var j, len, r;
      for (j = 0, len = regs.length; j < len; j++) {
        r = regs[j];
        if (!r.test(s)) {
          return false;
        }
      }
      return true;
    };
    ref = get_words_regs(q), words = ref[0], regs = ref[1];
    matches = [];
    for (j = 0, len = docs.length; j < len; j++) {
      d = docs[j];
      if (matches.length >= num_items) {
        break;
      }
      if (GOVWIKI.state_filter && d.state !== GOVWIKI.state_filter) {
        continue;
      }
      if (GOVWIKI.gov_type_filter && d.gov_type !== GOVWIKI.gov_type_filter) {
        continue;
      }
      if (test_string(d.gov_name, regs)) {
        matches.push($.extend({}, d));
      }
    }
    select_text(matches, words, regs);
    cb(matches);
  };
};

select_text = function(clones, words, regs) {
  var d, j, len;
  for (j = 0, len = clones.length; j < len; j++) {
    d = clones[j];
    d.gov_name = strongify(d.gov_name, words, regs);
  }
  return clones;
};

strongify = function(s, words, regs) {
  regs.forEach(function(r, i) {
    return s = s.replace(r, "<b>" + words[i] + "</b>");
  });
  return s;
};

strip = function(s) {
  return s.replace(/<[^<>]*>/g, '');
};

full_trim = function(s) {
  var ss;
  ss = s.trim('' + s);
  return ss = ss.replace(/ +/g, ' ');
};

get_words = function(str) {
  return full_trim(str).split(' ');
};

get_words_regs = function(str) {
  var regs, words;
  words = get_words(str);
  regs = words.map(function(w) {
    return new RegExp("" + w, 'i');
  });
  return [words, regs];
};

module.exports = QueryMather;


},{}],5:[function(require,module,exports){

/*
 * file: templates2.coffee ----------------------------------------------------------------------
 *
 * Class to manage templates and render data on html page.
 *
 * The main method : render(data), get_html(data)
#-------------------------------------------------------------------------------------------------
 */
var Templates2, add_other_tab_to_layout, convert_fusion_template, currency, fieldNames, fieldNamesHelp, get_layout_fields, get_record_fields, get_unmentioned_fields, render_field, render_field_name, render_field_name_help, render_field_value, render_fields, render_financial_fields, render_subheading, render_tabs, toTitleCase, under;

fieldNames = {};

fieldNamesHelp = {};

render_field_value = function(n, mask, data) {
  var v;
  v = data[n];
  if (!data[n]) {
    return '';
  }
  if (n === "web_site") {
    return "<a target='_blank' href='" + v + "'>" + v + "</a>";
  } else {
    if ('' !== mask) {
      if (data[n + '_rank'] && data.max_ranks && data.max_ranks[n + '_max_rank']) {
        v = numeral(v).format(mask);
        return v + " <span class='rank'>(" + data[n + '_rank'] + " of " + data.max_ranks[n + '_max_rank'] + ")</span>";
      }
      if (n === "number_of_full_time_employees") {
        return numeral(v).format('0,0');
      }
      return numeral(v).format(mask);
    } else {
      if (v.length > 20 && n === "open_enrollment_schools") {
        v = v.substring(0, 19) + ("<div style='display:inline;color:#074d71'  title='" + v + "'>&hellip;</div>");
      }
      if (v.length > 20 && n === "parent_trigger_eligible_schools") {
        return v = v.substring(0, 19) + ("<div style='display:inline;color:#074d71'  title='" + v + "'>&hellip;</div>");
      } else {
        if (v.length > 21) {
          v = v.substring(0, 21);
        } else {

        }
        return v;
      }
    }
  }
};

render_field_name_help = function(fName) {
  return fieldNamesHelp[fName];
};

render_field_name = function(fName) {
  var s;
  if (fieldNames[fName] != null) {
    return fieldNames[fName];
  }
  s = fName.replace(/_/g, " ");
  s = s.charAt(0).toUpperCase() + s.substring(1);
  return s;
};

render_field = function(fName, data) {
  var fValue;
  if ("_" === substr(fName, 0, 1)) {
    return "<div>\n    <span class='f-nam' >" + (render_field_name(fName)) + "</span>\n    <span class='f-val'>&nbsp;</span>\n</div>";
  } else {
    if (!(fValue = data[fName])) {
      return '';
    }
    return "<div>\n    <span class='f-nam'  >" + (render_field_name(fName)) + "<div></span>\n    <span class='f-val'>" + (render_field_value(fName, data)) + "</span>\n</div>";
  }
};

render_subheading = function(fName, mask, notFirst) {
  var s;
  s = '';
  fName = render_field_name(fName);
  if (mask === "heading") {
    if (notFirst !== 0) {
      s += "<br/>";
    }
    s += "<div><span class='f-nam'>" + fName + "</span><span class='f-val'> </span></div>";
  }
  return s;
};

render_fields = function(fields, data, template) {
  var fName, fNameHelp, fValue, field, h, i, j, len;
  h = '';
  for (i = j = 0, len = fields.length; j < len; i = ++j) {
    field = fields[i];
    if (typeof field === "object") {
      if (field.mask === "heading") {
        h += render_subheading(field.name, field.mask, i);
        fValue = '';
      } else {
        fValue = render_field_value(field.name, field.mask, data);
        if ('' !== fValue && fValue !== '0') {
          fName = render_field_name(field.name);
          fNameHelp = render_field_name_help(field.name);
        } else {
          fValue = '';
        }
      }
    } else {
      fValue = render_field_value(field, '', data);
      if ('' !== fValue) {
        fName = render_field_name(field);
        fNameHelp = render_field_name_help(fName);
      }
    }
    if ('' !== fValue) {
      h += template({
        name: fName,
        value: fValue,
        help: fNameHelp
      });
    }
  }
  return h;
};

render_financial_fields = function(data, template) {
  var category, field, h, is_first_row, j, len, mask, ref;
  h = '';
  mask = '0,0';
  category = '';
  is_first_row = false;
  for (j = 0, len = data.length; j < len; j++) {
    field = data[j];
    if (category !== field.category_name) {
      category = field.category_name;
      if (category === 'Overview') {
        h += template({
          name: "<b>" + category + "</b>",
          genfund: '',
          otherfunds: '',
          totalfunds: ''
        });
      } else if (category === 'Revenues') {
        h += '</br>';
        h += "<b>" + template({
          name: category,
          genfund: "General Fund",
          otherfunds: "Other Funds",
          totalfunds: "Total Gov. Funds"
        }) + "</b>";
        is_first_row = true;
      } else {
        h += '</br>';
        h += template({
          name: "<b>" + category + "</b>",
          genfund: '',
          otherfunds: '',
          totalfunds: ''
        });
        is_first_row = true;
      }
    }
    if (field.caption === 'General Fund Balance' || field.caption === 'Long Term Debt') {
      h += template({
        name: field.caption,
        genfund: currency(field.genfund, mask, '<span class="currency-sign">$</span>')
      });
    } else if (((ref = field.caption) === 'Total Revenues' || ref === 'Total Expenditures' || ref === 'Surplus / (Deficit)') || is_first_row) {
      h += template({
        name: field.caption,
        genfund: currency(field.genfund, mask, '<span class="currency-sign">$</span>'),
        otherfunds: currency(field.otherfunds, mask, '<span class="currency-sign">$</span>'),
        totalfunds: currency(field.totalfunds, mask, '<span class="currency-sign">$</span>')
      });
      is_first_row = false;
    } else {
      h += template({
        name: field.caption,
        genfund: currency(field.genfund, mask),
        otherfunds: currency(field.otherfunds, mask),
        totalfunds: currency(field.totalfunds, mask)
      });
    }
  }
  return h;
};

under = function(s) {
  return s.replace(/[\s\+\-]/g, '_');
};

toTitleCase = function(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

currency = function(n, mask, sign) {
  var s;
  if (sign == null) {
    sign = '';
  }
  n = numeral(n);
  if (n < 0) {
    s = n.format(mask).toString();
    s = s.replace(/-/g, '');
    return "(" + sign + ('<span class="fin-val">' + s + '</span>') + ")";
  }
  n = n.format(mask);
  return "" + sign + ('<span class="fin-val">' + n + '</span>');
};

render_tabs = function(initial_layout, data, tabset, parent) {
  var bigChartWidth, detail_data, drawChart, graph, h, i, j, layout, layout_data, len, len1, len2, m, o, official, official_data, plot_handles, ref, smallChartWidth, tab, templates;
  layout = initial_layout;
  templates = parent.templates;
  plot_handles = {};
  layout_data = {
    title: data.gov_name,
    wikipedia_page_exists: data.wikipedia_page_exists,
    wikipedia_page_name: data.wikipedia_page_name,
    transparent_california_page_name: data.transparent_california_page_name,
    latest_audit_url: data.latest_audit_url,
    tabs: [],
    tabcontent: ''
  };
  for (i = j = 0, len = layout.length; j < len; i = ++j) {
    tab = layout[i];
    layout_data.tabs.push({
      tabid: under(tab.name),
      tabname: tab.name,
      active: (i > 0 ? '' : 'active')
    });
  }
  for (i = m = 0, len1 = layout.length; m < len1; i = ++m) {
    tab = layout[i];
    detail_data = {
      tabid: under(tab.name),
      tabname: tab.name,
      active: (i > 0 ? '' : 'active'),
      tabcontent: ''
    };
    switch (tab.name) {
      case 'Overview + Elected Officials':
        detail_data.tabcontent += render_fields(tab.fields, data, templates['tabdetail-namevalue-template']);
        console.log(data.elected_officials.record);
        ref = data.elected_officials.record;
        for (i = o = 0, len2 = ref.length; o < len2; i = ++o) {
          official = ref[i];
          official_data = {
            title: '' !== official.title ? "Title: " + official.title : void 0,
            name: '' !== official.full_name ? "Name: " + official.full_name : void 0,
            email: null !== official.email_address ? "Email: " + official.email_address : void 0,
            telephonenumber: null !== official.telephone_number && void 0 !== official.telephone_number ? "Telephone Number: " + official.telephone_number : void 0,
            termexpires: null !== official.term_expires ? "Term Expires: " + official.term_expires : void 0,
            govs_id: official.govs_id,
            elected_official_id: official.elected_official_id
          };
          if ('' !== official.photo_url && official.photo_url !== null) {
            official_data.image = '<img src="' + official.photo_url + '" class="portrait" alt="" />';
          }
          detail_data.tabcontent += templates['tabdetail-official-template'](official_data);
        }
        break;
      case 'Employee Compensation':
        h = '';
        h += render_fields(tab.fields, data, templates['tabdetail-namevalue-template']);
        detail_data.tabcontent += templates['tabdetail-employee-comp-template']({
          content: h
        });
        if (!plot_handles['median-comp-graph']) {
          graph = true;
          if (data['median_salary_per_full_time_emp'] === 0) {
            graph = false;
          }
          if (data['median_benefits_per_ft_emp'] === 0) {
            graph = false;
          }
          if (data['median_wages_general_public'] === 0) {
            graph = false;
          }
          if (data['median_benefits_general_public'] === 0) {
            graph = false;
          }
          smallChartWidth = 340;
          bigChartWidth = 470;
          if ($(window).width() < 490) {
            smallChartWidth = 300;
            bigChartWidth = 300;
          }
          drawChart = function() {
            return setTimeout((function() {
              var chart, formatter, options, vis_data;
              vis_data = new google.visualization.DataTable();
              vis_data.addColumn('string', 'Median Compensation');
              vis_data.addColumn('number', 'Wages');
              vis_data.addColumn('number', 'Bens.');
              vis_data.addRows([[toTitleCase(data.gov_name + '\n Employees'), data['median_salary_per_full_time_emp'], data['median_benefits_per_ft_emp']], ['All \n' + toTitleCase(data.gov_name + ' \n Residents'), data['median_wages_general_public'], data['median_benefits_general_public']]]);
              formatter = new google.visualization.NumberFormat({
                groupingSymbol: ',',
                fractionDigits: '0'
              });
              formatter.format(vis_data, 1);
              formatter.format(vis_data, 2);
              options = {
                'title': 'Median Total Compensation - Full Time Workers: \n Government vs. Private Sector',
                'titleTextStyle': {
                  'fontSize': 12
                },
                'tooltip': {
                  'textStyle': {
                    'fontSize': 12
                  }
                },
                'width': smallChartWidth,
                'height': 300,
                'isStacked': 'true',
                'colors': ['#005ce6', '#009933']
              };
              chart = new google.visualization.ColumnChart(document.getElementById('median-comp-graph'));
              chart.draw(vis_data, options);
            }), 1000);
          };
          if (graph) {
            google.load('visualization', '1.0', {
              'callback': drawChart(),
              'packages': 'corechart'
            });
          }
          plot_handles['median-comp-graph'] = 'median-comp-graph';
        }
        if (!plot_handles['median-pension-graph']) {
          graph = true;
          if (data['median_pension_30_year_retiree'] === 0) {
            graph = false;
          }
          drawChart = function() {
            return setTimeout((function() {
              var chart, formatter, options, vis_data;
              vis_data = new google.visualization.DataTable();
              vis_data.addColumn('string', 'Median Pension');
              vis_data.addColumn('number', 'Wages');
              vis_data.addRows([['Pension for \n Retiree w/ 30 Years', data['median_pension_30_year_retiree']]]);
              formatter = new google.visualization.NumberFormat({
                groupingSymbol: ',',
                fractionDigits: '0'
              });
              formatter.format(vis_data, 1);
              options = {
                'title': 'Median Total Pension',
                'titleTextStyle': {
                  'fontSize': 12
                },
                'tooltip': {
                  'textStyle': {
                    'fontSize': 12
                  }
                },
                'width': smallChartWidth,
                'height': 300,
                'bar': {
                  'groupWidth': '30%'
                },
                'isStacked': 'true',
                'colors': ['#005ce6', '#009933']
              };
              if (graph) {
                chart = new google.visualization.ColumnChart(document.getElementById('median-pension-graph'));
                chart.draw(vis_data, options);
              }
            }), 1000);
          };
          google.load('visualization', '1.0', {
            'callback': drawChart(),
            'packages': 'corechart'
          });
          plot_handles['median-pension-graph'] = 'median-pension-graph';
        }
        break;
      case 'Financial Health':
        h = '';
        h += render_fields(tab.fields, data, templates['tabdetail-namevalue-template']);
        detail_data.tabcontent += templates['tabdetail-financial-health-template']({
          content: h
        });
        if (!plot_handles['public-safety-pie'] && data['alt_type'] !== 'School District') {
          graph = true;
          if (data['public_safety_exp_over_tot_gov_fund_revenue'] === 0) {
            graph = false;
          }
          drawChart = function() {
            return setTimeout((function() {
              var chart, options, vis_data;
              vis_data = new google.visualization.DataTable();
              vis_data.addColumn('string', 'Public Safety Expense');
              vis_data.addColumn('number', 'Total');
              vis_data.addRows([['Public Safety Exp', 1 - data['public_safety_exp_over_tot_gov_fund_revenue']], ['Other', data['public_safety_exp_over_tot_gov_fund_revenue']]]);
              options = {
                'title': 'Public safety expense',
                'titleTextStyle': {
                  'fontSize': 12
                },
                'tooltip': {
                  'textStyle': {
                    'fontSize': 12
                  }
                },
                'width': smallChartWidth,
                'height': 300,
                'is3D': 'true',
                'colors': ['#005ce6', '#009933'],
                'slices': {
                  1: {
                    offset: 0.2
                  }
                },
                'pieStartAngle': 45
              };
              chart = new google.visualization.PieChart(document.getElementById('public-safety-pie'));
              chart.draw(vis_data, options);
            }), 1000);
          };
          if (graph) {
            google.load('visualization', '1.0', {
              'callback': drawChart(),
              'packages': 'corechart'
            });
          }
          plot_handles['public-safety-pie'] = 'public-safety-pie';
        }
        if (!plot_handles['fin-health-revenue-graph'] && data['alt_type'] !== 'School District') {
          graph = true;
          if (data['total_revenue_per_capita'] === 0) {
            graph = false;
          }
          drawChart = function() {
            return setTimeout((function() {
              var chart, options, vis_data;
              vis_data = new google.visualization.DataTable();
              vis_data.addColumn('string', 'Per Capita');
              vis_data.addColumn('number', 'Rev.');
              vis_data.addRows([['Total Revenue \n Per Capita', data['total_revenue_per_capita']], ['Median Total \n Revenue Per \n Capita For All Cities', 420]]);
              options = {
                'title': 'Total Revenue',
                'titleTextStyle': {
                  'fontSize': 12
                },
                'tooltip': {
                  'textStyle': {
                    'fontSize': 12
                  }
                },
                'width': smallChartWidth,
                'height': 300,
                'isStacked': 'true',
                'colors': ['#005ce6', '#009933'],
                'chartArea.width': '100%'
              };
              chart = new google.visualization.ColumnChart(document.getElementById('fin-health-revenue-graph'));
              chart.draw(vis_data, options);
            }), 1000);
          };
          if (graph) {
            google.load('visualization', '1.0', {
              'callback': drawChart(),
              'packages': 'corechart'
            });
          }
          plot_handles['fin-health-revenue-graph'] = 'fin-health-revenue-graph';
        }
        if (!plot_handles['fin-health-expenditures-graph'] && data['alt_type'] !== 'School District') {
          graph = true;
          if (data['total_expenditures_per_capita'] === 0) {
            graph = false;
          }
          drawChart = function() {
            return setTimeout((function() {
              var chart, options, vis_data;
              vis_data = new google.visualization.DataTable();
              vis_data.addColumn('string', 'Per Capita');
              vis_data.addColumn('number', 'Exp.');
              vis_data.addRows([['Total Expenditures \n Per Capita', data['total_expenditures_per_capita']], ['Median Total \n Expenditures \n Per Capita \n For All Cities', 420]]);
              options = {
                'title': 'Total Expenditures',
                'titleTextStyle': {
                  'fontSize': 12
                },
                'tooltip': {
                  'textStyle': {
                    'fontSize': 12
                  }
                },
                'width': smallChartWidth,
                'height': 300,
                'isStacked': 'true',
                'colors': ['#005ce6', '#009933'],
                'chartArea.width': '100%'
              };
              if (graph) {
                chart = new google.visualization.ColumnChart(document.getElementById('fin-health-expenditures-graph'));
                chart.draw(vis_data, options);
              }
            }), 1000);
          };
          google.load('visualization', '1.0', {
            'callback': drawChart(),
            'packages': 'corechart'
          });
          plot_handles['fin-health-expenditures-graph'] = 'fin-health-expenditures-graph';
        }
        break;
      case 'Financial Statements':
        if (data.financial_statements) {
          h = '';
          h += render_financial_fields(data.financial_statements, templates['tabdetail-finstatement-template']);
          detail_data.tabcontent += templates['tabdetail-financial-statements-template']({
            content: h
          });
          if (!plot_handles['total-revenue-pie']) {
            graph = true;
            if (data.financial_statements.length === 0) {
              graph = false;
            }
            drawChart = function() {};
            setTimeout((function() {
              var chart, item, len3, options, p, r, ref1, rows, vis_data;
              vis_data = new google.visualization.DataTable();
              vis_data.addColumn('string', 'Total Gov. Expenditures');
              vis_data.addColumn('number', 'Total');
              rows = [];
              ref1 = data.financial_statements;
              for (p = 0, len3 = ref1.length; p < len3; p++) {
                item = ref1[p];
                console.log('@@@@' + JSON.stringify(item));
                if ((item.category_name === "Revenues") && (item.caption !== "Total Revenues")) {
                  r = [item.caption, parseInt(item.totalfunds)];
                  rows.push(r);
                }
              }
              vis_data.addRows(rows);
              options = {
                'title': 'Total Revenues',
                'titleTextStyle': {
                  'fontSize': 16
                },
                'tooltip': {
                  'textStyle': {
                    'fontSize': 12
                  }
                },
                'width': bigChartWidth,
                'height': 350,
                'pieStartAngle': 60,
                'sliceVisibilityThreshold': .05,
                'forceIFrame': true,
                'chartArea': {
                  width: '90%',
                  height: '75%'
                }
              };
              if (graph) {
                chart = new google.visualization.PieChart(document.getElementById('total-revenue-pie'));
                chart.draw(vis_data, options);
              }
            }), 1000);
          }
          if (graph) {
            google.load('visualization', '1.0', {
              'callback': drawChart(),
              'packages': 'corechart'
            });
          }
          plot_handles['total-revenue-pie'] = 'total-revenue-pie';
          if (!plot_handles['total-expenditures-pie']) {
            graph = true;
            if (data.financial_statements.length === 0) {
              graph = false;
            }
            drawChart = function() {};
            setTimeout((function() {
              var chart, item, len3, options, p, r, ref1, rows, vis_data;
              vis_data = new google.visualization.DataTable();
              vis_data.addColumn('string', 'Total Gov. Expenditures');
              vis_data.addColumn('number', 'Total');
              rows = [];
              ref1 = data.financial_statements;
              for (p = 0, len3 = ref1.length; p < len3; p++) {
                item = ref1[p];
                if ((item.category_name === "Expenditures") && (item.caption !== "Total Expenditures")) {
                  r = [item.caption, parseInt(item.totalfunds)];
                  rows.push(r);
                }
              }
              vis_data.addRows(rows);
              options = {
                'title': 'Total Expenditures',
                'titleTextStyle': {
                  'fontSize': 16
                },
                'tooltip': {
                  'textStyle': {
                    'fontSize': 12
                  }
                },
                'width': bigChartWidth,
                'height': 350,
                'pieStartAngle': 60,
                'sliceVisibilityThreshold': .05,
                'forceIFrame': true,
                'chartArea': {
                  width: '90%',
                  height: '75%'
                }
              };
              if (graph) {
                chart = new google.visualization.PieChart(document.getElementById('total-expenditures-pie'));
                chart.draw(vis_data, options);
              }
            }), 1000);
          }
          if (graph) {
            google.load('visualization', '1.0', {
              'callback': drawChart(),
              'packages': 'corechart'
            });
          }
          plot_handles['total-expenditures-pie'] = 'total-expenditures-pie';
        }
        break;
      default:
        detail_data.tabcontent += render_fields(tab.fields, data, templates['tabdetail-namevalue-template']);
    }
    layout_data.tabcontent += templates['tabdetail-template'](detail_data);
  }
  return templates['tabpanel-template'](layout_data);
};

get_layout_fields = function(la) {
  var f, field, j, len, len1, m, ref, t;
  f = {};
  for (j = 0, len = la.length; j < len; j++) {
    t = la[j];
    ref = t.fields;
    for (m = 0, len1 = ref.length; m < len1; m++) {
      field = ref[m];
      f[field] = 1;
    }
  }
  return f;
};

get_record_fields = function(r) {
  var f, field_name;
  f = {};
  for (field_name in r) {
    f[field_name] = 1;
  }
  return f;
};

get_unmentioned_fields = function(la, r) {
  var f, layout_fields, record_fields, unmentioned_fields;
  layout_fields = get_layout_fields(la);
  record_fields = get_record_fields(r);
  unmentioned_fields = [];
  for (f in record_fields) {
    if (!layout_fields[f]) {
      unmentioned_fields.push(f);
    }
  }
  return unmentioned_fields;
};

add_other_tab_to_layout = function(layout, data) {
  var l, t;
  if (layout == null) {
    layout = [];
  }
  l = $.extend(true, [], layout);
  t = {
    name: "Other",
    fields: get_unmentioned_fields(l, data)
  };
  l.push(t);
  return l;
};

convert_fusion_template = function(templ) {
  var categories, categories_array, categories_sort, category, col_hash, fieldname, fields, get_col_hash, hash_to_array, i, j, len, len1, len2, len3, m, n, o, obj, p, placeholder_count, ref, ref1, row, tab_hash, tab_newhash, tabs, val;
  tab_hash = {};
  tabs = [];
  get_col_hash = function(columns) {
    var col_hash, col_name, i, j, len, ref;
    col_hash = {};
    ref = templ.columns;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      col_name = ref[i];
      col_hash[col_name] = i;
    }
    return col_hash;
  };
  val = function(field_name, fields, col_hash) {
    return fields[col_hash[field_name]];
  };
  hash_to_array = function(hash) {
    var a, k, tab;
    a = [];
    for (k in hash) {
      tab = {};
      tab.name = k;
      tab.fields = hash[k];
      a.push(tab);
    }
    return a;
  };
  col_hash = get_col_hash(templ.col_hash);
  placeholder_count = 0;
  ref = templ.rows;
  for (i = j = 0, len = ref.length; j < len; i = ++j) {
    row = ref[i];
    category = val('general_category', row, col_hash);
    fieldname = val('field_name', row, col_hash);
    if (!fieldname) {
      fieldname = "_" + String(++placeholder_count);
    }
    fieldNames[val('field_name', row, col_hash)] = val('description', row, col_hash);
    fieldNamesHelp[fieldname] = val('help_text', row, col_hash);
    if (category) {
      if (tab_hash[category] == null) {
        tab_hash[category] = [];
      }
      tab_hash[category].push({
        n: val('n', row, col_hash),
        name: fieldname,
        mask: val('mask', row, col_hash)
      });
    }
  }
  categories = Object.keys(tab_hash);
  categories_sort = {};
  for (m = 0, len1 = categories.length; m < len1; m++) {
    category = categories[m];
    if (!categories_sort[category]) {
      categories_sort[category] = tab_hash[category][0].n;
    }
    fields = [];
    ref1 = tab_hash[category];
    for (o = 0, len2 = ref1.length; o < len2; o++) {
      obj = ref1[o];
      fields.push(obj);
    }
    fields.sort(function(a, b) {
      return a.n - b.n;
    });
    tab_hash[category] = fields;
  }
  categories_array = [];
  for (category in categories_sort) {
    n = categories_sort[category];
    categories_array.push({
      category: category,
      n: n
    });
  }
  categories_array.sort(function(a, b) {
    return a.n - b.n;
  });
  tab_newhash = {};
  for (p = 0, len3 = categories_array.length; p < len3; p++) {
    category = categories_array[p];
    tab_newhash[category.category] = tab_hash[category.category];
  }
  tabs = hash_to_array(tab_newhash);
  return tabs;
};

Templates2 = (function() {
  Templates2.list = void 0;

  Templates2.templates = void 0;

  Templates2.data = void 0;

  Templates2.events = void 0;

  function Templates2() {
    var i, j, len, len1, m, template, templateList, templatePartials;
    this.list = [];
    this.events = {};
    templateList = ['tabpanel-template', 'tabdetail-template', 'tabdetail-namevalue-template', 'tabdetail-finstatement-template', 'tabdetail-official-template', 'tabdetail-employee-comp-template', 'tabdetail-financial-health-template', 'tabdetail-financial-statements-template', 'person-info-template'];
    templatePartials = ['tab-template'];
    this.templates = {};
    for (i = j = 0, len = templateList.length; j < len; i = ++j) {
      template = templateList[i];
      this.templates[template] = Handlebars.compile($('#' + template).html());
    }
    for (i = m = 0, len1 = templatePartials.length; m < len1; i = ++m) {
      template = templatePartials[i];
      Handlebars.registerPartial(template, $('#' + template).html());
    }
  }

  Templates2.prototype.add_template = function(layout_name, layout_json) {
    return this.list.push({
      parent: this,
      name: layout_name,
      render: function(dat) {
        this.parent.data = dat;
        return render_tabs(layout_json, dat, this, this.parent);
      },
      bind: function(tpl_name, callback) {
        if (!this.parent.events[tpl_name]) {
          return this.parent.events[tpl_name] = [callback];
        } else {
          return this.parent.events[tpl_name].push(callback);
        }
      },
      activate: function(tpl_name) {
        var e, i, j, len, ref, results;
        if (this.parent.events[tpl_name]) {
          ref = this.parent.events[tpl_name];
          results = [];
          for (i = j = 0, len = ref.length; j < len; i = ++j) {
            e = ref[i];
            results.push(e(tpl_name, this.parent.data));
          }
          return results;
        }
      }
    });
  };

  Templates2.prototype.load_template = function(template_name, url) {
    return $.ajax({
      url: url,
      dataType: 'json',
      cache: true,
      success: (function(_this) {
        return function(template_json) {
          _this.add_template(template_name, template_json);
        };
      })(this)
    });
  };

  Templates2.prototype.load_fusion_template = function(template_name, url) {
    return $.ajax({
      url: url,
      dataType: 'json',
      cache: true,
      success: (function(_this) {
        return function(template_json) {
          var t;
          t = convert_fusion_template(template_json);
          _this.add_template(template_name, t);
        };
      })(this)
    });
  };

  Templates2.prototype.get_names = function() {
    var j, len, ref, results, t;
    ref = this.list;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      t = ref[j];
      results.push(t.name);
    }
    return results;
  };

  Templates2.prototype.get_index_by_name = function(name) {
    var i, j, len, ref, t;
    ref = this.list;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      t = ref[i];
      if (t.name === name) {
        return i;
      }
    }
    return -1;
  };

  Templates2.prototype.get_html = function(ind, data) {
    if (ind === -1) {
      return "";
    }
    if (this.list[ind]) {
      return this.list[ind].render(data);
    } else {
      return "";
    }
  };

  Templates2.prototype.activate = function(ind, tpl_name) {
    if (this.list[ind]) {
      return this.list[ind].activate(tpl_name);
    }
  };

  return Templates2;

})();

module.exports = Templates2;


},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvZGFtcGlsb24vV2Vic3Rvcm1Qcm9qZWN0cy9nb3Z3aWtpLWRldi51cy9jb2ZmZWUvZ292bWFwLmNvZmZlZSIsIi9ob21lL2RhbXBpbG9uL1dlYnN0b3JtUHJvamVjdHMvZ292d2lraS1kZXYudXMvY29mZmVlL2dvdnNlbGVjdG9yLmNvZmZlZSIsIi9ob21lL2RhbXBpbG9uL1dlYnN0b3JtUHJvamVjdHMvZ292d2lraS1kZXYudXMvY29mZmVlL21haW4uY29mZmVlIiwiL2hvbWUvZGFtcGlsb24vV2Vic3Rvcm1Qcm9qZWN0cy9nb3Z3aWtpLWRldi51cy9jb2ZmZWUvcXVlcnltYXRjaGVyLmNvZmZlZSIsIi9ob21lL2RhbXBpbG9uL1dlYnN0b3JtUHJvamVjdHMvZ292d2lraS1kZXYudXMvY29mZmVlL3RlbXBsYXRlczIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSw0TEFBQTtFQUFBOztBQUFBLGNBQUEsR0FBZTs7QUFHZixHQUFBLEdBQVUsSUFBQSxLQUFBLENBQ1I7RUFBQSxFQUFBLEVBQUksU0FBSjtFQUNBLEdBQUEsRUFBSyxJQURMO0VBRUEsR0FBQSxFQUFLLENBQUMsS0FGTjtFQUdBLElBQUEsRUFBTSxDQUhOO0VBSUEsT0FBQSxFQUFTLENBSlQ7RUFLQSxXQUFBLEVBQWEsSUFMYjtFQU1BLFVBQUEsRUFBWSxLQU5aO0VBT0EsV0FBQSxFQUFhLElBUGI7RUFRQSxrQkFBQSxFQUNFO0lBQUEsS0FBQSxFQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBcEM7R0FURjtFQVVBLGNBQUEsRUFBZ0IsU0FBQTtXQUNkLHVCQUFBLENBQXdCLEdBQXhCO0VBRGMsQ0FWaEI7Q0FEUTs7QUFjVixHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVMs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QUEsRUFBVSxNQURWO01BRUEsS0FBQSxFQUFPLElBRlA7TUFHQSxPQUFBLEVBQVMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLGFBQUQ7QUFDUCxjQUFBO1VBQUEsQ0FBQSxHQUFJLHVCQUFBLENBQXdCLGFBQXhCO1VBQ0osS0FBQyxDQUFBLFlBQUQsQ0FBYyxhQUFkLEVBQTZCLENBQTdCO1FBRk87TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBSFQ7S0FERjtFQURtQjs7dUJBV3JCLFNBQUEsR0FBVyxTQUFBO0FBQ1QsUUFBQTtBQUFDO0FBQUE7U0FBQSxxQ0FBQTs7bUJBQUEsQ0FBQyxDQUFDO0FBQUY7O0VBRFE7O3VCQUdYLGlCQUFBLEdBQW1CLFNBQUMsSUFBRDtBQUNqQixRQUFBO0FBQUE7QUFBQSxTQUFBLDZDQUFBOztNQUNFLElBQUcsQ0FBQyxDQUFDLElBQUYsS0FBVSxJQUFiO0FBQ0UsZUFBTyxFQURUOztBQURGO0FBR0MsV0FBTyxDQUFDO0VBSlE7O3VCQU1uQixRQUFBLEdBQVUsU0FBQyxHQUFELEVBQU0sSUFBTjtJQUNSLElBQUksR0FBQSxLQUFPLENBQUMsQ0FBWjtBQUFvQixhQUFRLEdBQTVCOztJQUVBLElBQUcsSUFBQyxDQUFBLElBQUssQ0FBQSxHQUFBLENBQVQ7QUFDRSxhQUFPLElBQUMsQ0FBQSxJQUFLLENBQUEsR0FBQSxDQUFJLENBQUMsTUFBWCxDQUFrQixJQUFsQixFQURUO0tBQUEsTUFBQTtBQUdFLGFBQU8sR0FIVDs7RUFIUTs7dUJBUVYsUUFBQSxHQUFVLFNBQUMsR0FBRCxFQUFNLFFBQU47SUFDUixJQUFHLElBQUMsQ0FBQSxJQUFLLENBQUEsR0FBQSxDQUFUO2FBQ0UsSUFBQyxDQUFBLElBQUssQ0FBQSxHQUFBLENBQUksQ0FBQyxRQUFYLENBQW9CLFFBQXBCLEVBREY7O0VBRFE7Ozs7OztBQUlaLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImJvdW5kc190aW1lb3V0PXVuZGVmaW5lZFxuXG5cbm1hcCA9IG5ldyBHTWFwc1xuICBlbDogJyNnb3ZtYXAnXG4gIGxhdDogMzcuM1xuICBsbmc6IC0xMTkuM1xuICB6b29tOiA2XG4gIG1pblpvb206IDZcbiAgc2Nyb2xsd2hlZWw6IHRydWVcbiAgcGFuQ29udHJvbDogZmFsc2VcbiAgem9vbUNvbnRyb2w6IHRydWVcbiAgem9vbUNvbnRyb2xPcHRpb25zOlxuICAgIHN0eWxlOiBnb29nbGUubWFwcy5ab29tQ29udHJvbFN0eWxlLlNNQUxMXG4gIGJvdW5kc19jaGFuZ2VkOiAtPlxuICAgIG9uX2JvdW5kc19jaGFuZ2VkX2xhdGVyIDIwMFxuXG5tYXAubWFwLmNvbnRyb2xzW2dvb2dsZS5tYXBzLkNvbnRyb2xQb3NpdGlvbi5SSUdIVF9UT1BdLnB1c2goZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xlZ2VuZCcpKVxuXG4kIC0+XG4gICQoJyNsZWdlbmQgbGk6bm90KC5jb3VudGllcy10cmlnZ2VyKScpLm9uICdjbGljaycsIC0+XG4gICAgJCh0aGlzKS50b2dnbGVDbGFzcygnYWN0aXZlJylcbiAgICBoaWRkZW5fZmllbGQgPSAkKHRoaXMpLmZpbmQoJ2lucHV0JylcbiAgICB2YWx1ZSA9IGhpZGRlbl9maWVsZC52YWwoKVxuICAgIGhpZGRlbl9maWVsZC52YWwoaWYgdmFsdWUgPT0gJzEnIHRoZW4gJzAnIGVsc2UgJzEnKVxuICAgIHJlYnVpbGRfZmlsdGVyKClcblxuICAkKCcjbGVnZW5kIGxpLmNvdW50aWVzLXRyaWdnZXInKS5vbiAnY2xpY2snLCAtPlxuICAgICQodGhpcykudG9nZ2xlQ2xhc3MoJ2FjdGl2ZScpXG4gICAgaWYgJCh0aGlzKS5oYXNDbGFzcygnYWN0aXZlJykgdGhlbiBHT1ZXSUtJLmdldF9jb3VudGllcyBHT1ZXSUtJLmRyYXdfcG9seWdvbnMgZWxzZSBtYXAucmVtb3ZlUG9seWdvbnMoKVxuXG5yZWJ1aWxkX2ZpbHRlciA9IC0+XG4gIGhhcmRfcGFyYW1zID0gWydDaXR5JywgJ1NjaG9vbCBEaXN0cmljdCcsICdTcGVjaWFsIERpc3RyaWN0J11cbiAgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXJfMiA9IFtdXG4gICQoJy50eXBlX2ZpbHRlcicpLmVhY2ggKGluZGV4LCBlbGVtZW50KSAtPlxuICAgIGlmICQoZWxlbWVudCkuYXR0cignbmFtZScpIGluIGhhcmRfcGFyYW1zIGFuZCAkKGVsZW1lbnQpLnZhbCgpID09ICcxJ1xuICAgICAgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXJfMi5wdXNoICQoZWxlbWVudCkuYXR0cignbmFtZScpXG4gIG9uX2JvdW5kc19jaGFuZ2VkX2xhdGVyIDM1MFxuXG5vbl9ib3VuZHNfY2hhbmdlZF9sYXRlciAgPSAobXNlYykgIC0+XG4gIGNsZWFyVGltZW91dCBib3VuZHNfdGltZW91dFxuICBib3VuZHNfdGltZW91dCA9IHNldFRpbWVvdXQgb25fYm91bmRzX2NoYW5nZWQsIG1zZWNcblxuXG5vbl9ib3VuZHNfY2hhbmdlZCA9KGUpIC0+XG4gIGNvbnNvbGUubG9nIFwiYm91bmRzX2NoYW5nZWRcIlxuICBiPW1hcC5nZXRCb3VuZHMoKVxuICB1cmxfdmFsdWU9Yi50b1VybFZhbHVlKClcbiAgbmU9Yi5nZXROb3J0aEVhc3QoKVxuICBzdz1iLmdldFNvdXRoV2VzdCgpXG4gIG5lX2xhdD1uZS5sYXQoKVxuICBuZV9sbmc9bmUubG5nKClcbiAgc3dfbGF0PXN3LmxhdCgpXG4gIHN3X2xuZz1zdy5sbmcoKVxuICBzdCA9IEdPVldJS0kuc3RhdGVfZmlsdGVyXG4gIHR5ID0gR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXJcbiAgZ3RmID0gR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXJfMlxuXG4gICMjI1xuICAjIEJ1aWxkIHRoZSBxdWVyeS5cbiAgcT1cIlwiXCIgXCJsYXRpdHVkZVwiOntcIiRsdFwiOiN7bmVfbGF0fSxcIiRndFwiOiN7c3dfbGF0fX0sXCJsb25naXR1ZGVcIjp7XCIkbHRcIjoje25lX2xuZ30sXCIkZ3RcIjoje3N3X2xuZ319XCJcIlwiXG4gICMgQWRkIGZpbHRlcnMgaWYgdGhleSBleGlzdFxuICBxKz1cIlwiXCIsXCJzdGF0ZVwiOlwiI3tzdH1cIiBcIlwiXCIgaWYgc3RcbiAgcSs9XCJcIlwiLFwiZ292X3R5cGVcIjpcIiN7dHl9XCIgXCJcIlwiIGlmIHR5XG5cblxuICBnZXRfcmVjb3JkcyBxLCAyMDAsICAoZGF0YSkgLT5cbiAgICAjY29uc29sZS5sb2cgXCJsZW5ndGg9I3tkYXRhLmxlbmd0aH1cIlxuICAgICNjb25zb2xlLmxvZyBcImxhdDogI3tuZV9sYXR9LCN7c3dfbGF0fSBsbmc6ICN7bmVfbG5nfSwgI3tzd19sbmd9XCJcbiAgICBtYXAucmVtb3ZlTWFya2VycygpXG4gICAgYWRkX21hcmtlcihyZWMpIGZvciByZWMgaW4gZGF0YVxuICAgIHJldHVyblxuICAjIyNcblxuICAjIEJ1aWxkIHRoZSBxdWVyeSAyLlxuICBxMj1cIlwiXCIgbGF0aXR1ZGU8I3tuZV9sYXR9IEFORCBsYXRpdHVkZT4je3N3X2xhdH0gQU5EIGxvbmdpdHVkZTwje25lX2xuZ30gQU5EIGxvbmdpdHVkZT4je3N3X2xuZ30gQU5EIGFsdF90eXBlIT1cIkNvdW50eVwiIFwiXCJcIlxuICAjIEFkZCBmaWx0ZXJzIGlmIHRoZXkgZXhpc3RcbiAgcTIrPVwiXCJcIiBBTkQgc3RhdGU9XCIje3N0fVwiIFwiXCJcIiBpZiBzdFxuICBxMis9XCJcIlwiIEFORCBnb3ZfdHlwZT1cIiN7dHl9XCIgXCJcIlwiIGlmIHR5XG5cbiAgaWYgZ3RmLmxlbmd0aCA+IDBcbiAgICBmaXJzdCA9IHRydWVcbiAgICBhZGRpdGlvbmFsX2ZpbHRlciA9IFwiXCJcIiBBTkQgKFwiXCJcIlxuICAgIGZvciBnb3ZfdHlwZSBpbiBndGZcbiAgICAgIGlmIG5vdCBmaXJzdFxuICAgICAgICBhZGRpdGlvbmFsX2ZpbHRlciArPSBcIlwiXCIgT1JcIlwiXCJcbiAgICAgIGFkZGl0aW9uYWxfZmlsdGVyICs9IFwiXCJcIiBhbHRfdHlwZT1cIiN7Z292X3R5cGV9XCIgXCJcIlwiXG4gICAgICBmaXJzdCA9IGZhbHNlXG4gICAgYWRkaXRpb25hbF9maWx0ZXIgKz0gXCJcIlwiKVwiXCJcIlxuXG4gICAgcTIgKz0gYWRkaXRpb25hbF9maWx0ZXJcbiAgZWxzZVxuICAgIHEyICs9IFwiXCJcIiBBTkQgYWx0X3R5cGUhPVwiQ2l0eVwiIEFORCBhbHRfdHlwZSE9XCJTY2hvb2wgRGlzdHJpY3RcIiBBTkQgYWx0X3R5cGUhPVwiU3BlY2lhbCBEaXN0cmljdFwiIFwiXCJcIlxuXG4gIGdldF9yZWNvcmRzMiBxMiwgMjAwLCAgKGRhdGEpIC0+XG4gICAgI2NvbnNvbGUubG9nIFwibGVuZ3RoPSN7ZGF0YS5sZW5ndGh9XCJcbiAgICAjY29uc29sZS5sb2cgXCJsYXQ6ICN7bmVfbGF0fSwje3N3X2xhdH0gbG5nOiAje25lX2xuZ30sICN7c3dfbG5nfVwiXG4gICAgbWFwLnJlbW92ZU1hcmtlcnMoKVxuICAgIGFkZF9tYXJrZXIocmVjKSBmb3IgcmVjIGluIGRhdGEucmVjb3JkXG4gICAgcmV0dXJuXG5cbmdldF9pY29uID0oZ292X3R5cGUpIC0+XG5cbiAgX2NpcmNsZSA9KGNvbG9yKS0+XG4gICAgcGF0aDogZ29vZ2xlLm1hcHMuU3ltYm9sUGF0aC5DSVJDTEVcbiAgICBmaWxsT3BhY2l0eTogMVxuICAgIGZpbGxDb2xvcjpjb2xvclxuICAgIHN0cm9rZVdlaWdodDogMVxuICAgIHN0cm9rZUNvbG9yOid3aGl0ZSdcbiAgICAjc3Ryb2tlUG9zaXRpb246IGdvb2dsZS5tYXBzLlN0cm9rZVBvc2l0aW9uLk9VVFNJREVcbiAgICBzY2FsZTo2XG5cbiAgc3dpdGNoIGdvdl90eXBlXG4gICAgd2hlbiAnR2VuZXJhbCBQdXJwb3NlJyB0aGVuIHJldHVybiBfY2lyY2xlICdyZWQnXG4gICAgd2hlbiAnU2Nob29sIERpc3RyaWN0JyB0aGVuIHJldHVybiBfY2lyY2xlICdsaWdodGJsdWUnXG4gICAgd2hlbiAnRGVwZW5kZW50IFNjaG9vbCBTeXN0ZW0nIHRoZW4gcmV0dXJuIF9jaXJjbGUgJ2xpZ2h0Ymx1ZSdcbiMgICAgd2hlbiAnQ2VtZXRlcmllcycgICAgICB0aGVuIHJldHVybiBfY2lyY2xlICdwdXJwbGUnXG4jICAgIHdoZW4gJ0hvc3BpdGFscycgICAgICAgdGhlbiByZXR1cm4gX2NpcmNsZSAnYmx1ZSdcbiAgICBlbHNlIHJldHVybiBfY2lyY2xlICdwdXJwbGUnXG5cblxuXG5cbmFkZF9tYXJrZXIgPShyZWMpLT5cbiAgI2NvbnNvbGUubG9nIFwiI3tyZWMucmFuZH0gI3tyZWMuaW5jX2lkfSAje3JlYy56aXB9ICN7cmVjLmxhdGl0dWRlfSAje3JlYy5sb25naXR1ZGV9ICN7cmVjLmdvdl9uYW1lfVwiXG4gIG1hcC5hZGRNYXJrZXJcbiAgICBsYXQ6IHJlYy5sYXRpdHVkZVxuICAgIGxuZzogcmVjLmxvbmdpdHVkZVxuICAgIGljb246IGdldF9pY29uKHJlYy5nb3ZfdHlwZSlcbiAgICB0aXRsZTogIFwiI3tyZWMuZ292X25hbWV9LCAje3JlYy5nb3ZfdHlwZX1cIlxuICAgIGluZm9XaW5kb3c6XG4gICAgICBjb250ZW50OiBjcmVhdGVfaW5mb193aW5kb3cgcmVjXG4gICAgY2xpY2s6IChlKS0+XG4gICAgICAjd2luZG93LkdPVldJS0kuc2hvd19yZWNvcmQgcmVjXG4gICAgICB3aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZDIgcmVjXG5cbiAgcmV0dXJuXG5cblxuY3JlYXRlX2luZm9fd2luZG93ID0ocikgLT5cbiAgdyA9ICQoJzxkaXY+PC9kaXY+JylcbiAgLmFwcGVuZCAkKFwiPGEgaHJlZj0nIyc+PHN0cm9uZz4je3IuZ292X25hbWV9PC9zdHJvbmc+PC9hPlwiKS5jbGljayAoZSktPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnNvbGUubG9nIHJcbiAgICAjd2luZG93LkdPVldJS0kuc2hvd19yZWNvcmQgclxuICAgIHdpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkMiByXG5cbiAgLmFwcGVuZCAkKFwiPGRpdj4gI3tyLmdvdl90eXBlfSAgI3tyLmNpdHl9ICN7ci56aXB9ICN7ci5zdGF0ZX08L2Rpdj5cIilcbiAgcmV0dXJuIHdbMF1cblxuXG5cblxuZ2V0X3JlY29yZHMgPSAocXVlcnksIGxpbWl0LCBvbnN1Y2Nlc3MpIC0+XG4gICQuYWpheFxuICAgIHVybDogXCJodHRwczovL2FwaS5tb25nb2xhYi5jb20vYXBpLzEvZGF0YWJhc2VzL2dvdndpa2kvY29sbGVjdGlvbnMvZ292cy8/cT17I3txdWVyeX19JmY9e19pZDowfSZsPSN7bGltaXR9JnM9e3JhbmQ6MX0mYXBpS2V5PTBZNVhfUWsydU9KUmRISldKS1NSV2s2bDZKcVZUUzJ5XCJcbiAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgY2FjaGU6IHRydWVcbiAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcbiAgICBlcnJvcjooZSkgLT5cbiAgICAgIGNvbnNvbGUubG9nIGVcblxuXG5nZXRfcmVjb3JkczIgPSAocXVlcnksIGxpbWl0LCBvbnN1Y2Nlc3MpIC0+XG4gICQuYWpheFxuICAgIHVybDpcImh0dHA6Ly80Ni4xMDEuMy43OTo4MC9yZXN0L2RiL2dvdnNcIlxuICAgIGRhdGE6XG4gICAgICAjZmlsdGVyOlwibGF0aXR1ZGU+MzIgQU5EIGxhdGl0dWRlPDM0IEFORCBsb25naXR1ZGU+LTg3IEFORCBsb25naXR1ZGU8LTg2XCJcbiAgICAgIGZpbHRlcjpxdWVyeVxuICAgICAgZmllbGRzOlwiX2lkLGluY19pZCxnb3ZfbmFtZSxnb3ZfdHlwZSxjaXR5LHppcCxzdGF0ZSxsYXRpdHVkZSxsb25naXR1ZGUsYWx0X25hbWVcIlxuICAgICAgYXBwX25hbWU6XCJnb3Z3aWtpXCJcbiAgICAgIG9yZGVyOlwicmFuZFwiXG4gICAgICBsaW1pdDpsaW1pdFxuXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgIGNhY2hlOiB0cnVlXG4gICAgc3VjY2Vzczogb25zdWNjZXNzXG4gICAgZXJyb3I6KGUpIC0+XG4gICAgICBjb25zb2xlLmxvZyBlXG5cbiMgR0VPQ09ESU5HID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxucGluSW1hZ2UgPSBuZXcgKGdvb2dsZS5tYXBzLk1hcmtlckltYWdlKShcbiAgJ2h0dHA6Ly9jaGFydC5hcGlzLmdvb2dsZS5jb20vY2hhcnQ/Y2hzdD1kX21hcF9waW5fbGV0dGVyJmNobGQ9Wnw3Nzc3QkJ8RkZGRkZGJyAsXG4gIG5ldyAoZ29vZ2xlLm1hcHMuU2l6ZSkoMjEsIDM0KSxcbiAgbmV3IChnb29nbGUubWFwcy5Qb2ludCkoMCwgMCksXG4gIG5ldyAoZ29vZ2xlLm1hcHMuUG9pbnQpKDEwLCAzNClcbiAgKVxuXG5cbmdlb2NvZGVfYWRkciA9IChhZGRyLGRhdGEpIC0+XG4gIEdNYXBzLmdlb2NvZGVcbiAgICBhZGRyZXNzOiBhZGRyXG4gICAgY2FsbGJhY2s6IChyZXN1bHRzLCBzdGF0dXMpIC0+XG4gICAgICBpZiBzdGF0dXMgPT0gJ09LJ1xuICAgICAgICBsYXRsbmcgPSByZXN1bHRzWzBdLmdlb21ldHJ5LmxvY2F0aW9uXG4gICAgICAgIG1hcC5zZXRDZW50ZXIgbGF0bG5nLmxhdCgpLCBsYXRsbmcubG5nKClcbiAgICAgICAgbWFwLmFkZE1hcmtlclxuICAgICAgICAgIGxhdDogbGF0bG5nLmxhdCgpXG4gICAgICAgICAgbG5nOiBsYXRsbmcubG5nKClcbiAgICAgICAgICBzaXplOiAnc21hbGwnXG4gICAgICAgICAgdGl0bGU6IHJlc3VsdHNbMF0uZm9ybWF0dGVkX2FkZHJlc3NcbiAgICAgICAgICBpbmZvV2luZG93OlxuICAgICAgICAgICAgY29udGVudDogcmVzdWx0c1swXS5mb3JtYXR0ZWRfYWRkcmVzc1xuXG4gICAgICAgIGlmIGRhdGFcbiAgICAgICAgICBtYXAuYWRkTWFya2VyXG4gICAgICAgICAgICBsYXQ6IGRhdGEubGF0aXR1ZGVcbiAgICAgICAgICAgIGxuZzogZGF0YS5sb25naXR1ZGVcbiAgICAgICAgICAgIHNpemU6ICdzbWFsbCdcbiAgICAgICAgICAgIGNvbG9yOiAnYmx1ZSdcbiAgICAgICAgICAgIGljb246IHBpbkltYWdlXG4gICAgICAgICAgICB0aXRsZTogIFwiI3tkYXRhLmxhdGl0dWRlfSAje2RhdGEubG9uZ2l0dWRlfVwiXG4gICAgICAgICAgICBpbmZvV2luZG93OlxuICAgICAgICAgICAgICBjb250ZW50OiBcIiN7ZGF0YS5sYXRpdHVkZX0gI3tkYXRhLmxvbmdpdHVkZX1cIlxuXG4gICAgICAgICQoJy5nb3ZtYXAtZm91bmQnKS5odG1sIFwiPHN0cm9uZz5GT1VORDogPC9zdHJvbmc+I3tyZXN1bHRzWzBdLmZvcm1hdHRlZF9hZGRyZXNzfVwiXG4gICAgICByZXR1cm5cblxuXG5jbGVhcj0ocyktPlxuICByZXR1cm4gaWYgcy5tYXRjaCgvIGJveCAvaSkgdGhlbiAnJyBlbHNlIHNcblxuZ2VvY29kZSA9IChkYXRhKSAtPlxuICBhZGRyID0gXCIje2NsZWFyKGRhdGEuYWRkcmVzczEpfSAje2NsZWFyKGRhdGEuYWRkcmVzczIpfSwgI3tkYXRhLmNpdHl9LCAje2RhdGEuc3RhdGV9ICN7ZGF0YS56aXB9LCBVU0FcIlxuICAkKCcjZ292YWRkcmVzcycpLnZhbChhZGRyKVxuICBnZW9jb2RlX2FkZHIgYWRkciwgZGF0YVxuXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgZ2VvY29kZTogZ2VvY29kZVxuICBnb2NvZGVfYWRkcjogZ2VvY29kZV9hZGRyXG4gIG9uX2JvdW5kc19jaGFuZ2VkOiBvbl9ib3VuZHNfY2hhbmdlZFxuICBvbl9ib3VuZHNfY2hhbmdlZF9sYXRlcjogb25fYm91bmRzX2NoYW5nZWRfbGF0ZXJcbiAgbWFwOiBtYXBcbiIsIlxucXVlcnlfbWF0Y2hlciA9IHJlcXVpcmUoJy4vcXVlcnltYXRjaGVyLmNvZmZlZScpXG5cbmNsYXNzIEdvdlNlbGVjdG9yXG4gIFxuICAjIHN0dWIgb2YgYSBjYWxsYmFjayB0byBlbnZva2Ugd2hlbiB0aGUgdXNlciBzZWxlY3RzIHNvbWV0aGluZ1xuICBvbl9zZWxlY3RlZDogKGV2dCwgZGF0YSwgbmFtZSkgLT5cblxuXG4gIGNvbnN0cnVjdG9yOiAoQGh0bWxfc2VsZWN0b3IsIGRvY3NfdXJsLCBAbnVtX2l0ZW1zKSAtPlxuICAgICQuYWpheFxuICAgICAgdXJsOiBkb2NzX3VybFxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgY2FjaGU6IHRydWVcbiAgICAgIHN1Y2Nlc3M6IEBzdGFydFN1Z2dlc3Rpb25cbiAgICAgIFxuXG5cblxuICBzdWdnZXN0aW9uVGVtcGxhdGUgOiBIYW5kbGViYXJzLmNvbXBpbGUoXCJcIlwiXG4gICAgPGRpdiBjbGFzcz1cInN1Z2ctYm94XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwic3VnZy1zdGF0ZVwiPnt7e3N0YXRlfX19PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwic3VnZy1uYW1lXCI+e3t7Z292X25hbWV9fX08L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJzdWdnLXR5cGVcIj57e3tnb3ZfdHlwZX19fTwvZGl2PlxuICAgIDwvZGl2PlwiXCJcIilcblxuXG5cbiAgZW50ZXJlZF92YWx1ZSA9IFwiXCJcblxuICBnb3ZzX2FycmF5ID0gW11cblxuICBjb3VudF9nb3ZzIDogKCkgLT5cbiAgICBjb3VudCA9MFxuICAgIGZvciBkIGluIEBnb3ZzX2FycmF5XG4gICAgICBpZiBHT1ZXSUtJLnN0YXRlX2ZpbHRlciBhbmQgZC5zdGF0ZSBpc250IEdPVldJS0kuc3RhdGVfZmlsdGVyIHRoZW4gY29udGludWVcbiAgICAgIGlmIEdPVldJS0kuZ292X3R5cGVfZmlsdGVyIGFuZCBkLmdvdl90eXBlIGlzbnQgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXIgdGhlbiBjb250aW51ZVxuICAgICAgY291bnQrK1xuICAgIHJldHVybiBjb3VudFxuXG5cbiAgc3RhcnRTdWdnZXN0aW9uIDogKGdvdnMpID0+XG4gICAgI0Bnb3ZzX2FycmF5ID0gZ292c1xuICAgIEBnb3ZzX2FycmF5ID0gZ292cy5yZWNvcmRcbiAgICAkKCcudHlwZWFoZWFkJykua2V5dXAgKGV2ZW50KSA9PlxuICAgICAgQGVudGVyZWRfdmFsdWUgPSAkKGV2ZW50LnRhcmdldCkudmFsKClcbiAgICBcbiAgICAkKEBodG1sX3NlbGVjdG9yKS5hdHRyICdwbGFjZWhvbGRlcicsICdHT1ZFUk5NRU5UIE5BTUUnXG4gICAgJChAaHRtbF9zZWxlY3RvcikudHlwZWFoZWFkKFxuICAgICAgICBoaW50OiBmYWxzZVxuICAgICAgICBoaWdobGlnaHQ6IGZhbHNlXG4gICAgICAgIG1pbkxlbmd0aDogMVxuICAgICAgICBjbGFzc05hbWVzOlxuICAgICAgICBcdG1lbnU6ICd0dC1kcm9wZG93bi1tZW51J1xuICAgICAgLFxuICAgICAgICBuYW1lOiAnZ292X25hbWUnXG4gICAgICAgIGRpc3BsYXlLZXk6ICdnb3ZfbmFtZSdcbiAgICAgICAgc291cmNlOiBxdWVyeV9tYXRjaGVyKEBnb3ZzX2FycmF5LCBAbnVtX2l0ZW1zKVxuICAgICAgICAjc291cmNlOiBibG9vZGhvdW5kLnR0QWRhcHRlcigpXG4gICAgICAgIHRlbXBsYXRlczogc3VnZ2VzdGlvbjogQHN1Z2dlc3Rpb25UZW1wbGF0ZVxuICAgIClcbiAgICAub24gJ3R5cGVhaGVhZDpzZWxlY3RlZCcsICAoZXZ0LCBkYXRhLCBuYW1lKSA9PlxuICAgICAgICAkKCcudHlwZWFoZWFkJykudHlwZWFoZWFkICd2YWwnLCBAZW50ZXJlZF92YWx1ZVxuICAgICAgICBAb25fc2VsZWN0ZWQoZXZ0LCBkYXRhLCBuYW1lKVxuICAgXG4gICAgLm9uICd0eXBlYWhlYWQ6Y3Vyc29yY2hhbmdlZCcsIChldnQsIGRhdGEsIG5hbWUpID0+XG4gICAgICAgICQoJy50eXBlYWhlYWQnKS52YWwgQGVudGVyZWRfdmFsdWVcbiAgICBcblxuICAgIyAkKCcuZ292LWNvdW50ZXInKS50ZXh0IEBjb3VudF9nb3ZzKClcbiAgICByZXR1cm5cblxuXG5cblxuXG5tb2R1bGUuZXhwb3J0cz1Hb3ZTZWxlY3RvclxuXG5cblxuIiwiIyMjXG5maWxlOiBtYWluLmNvZmZlIC0tIFRoZSBlbnRyeSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICA6XG5nb3ZfZmluZGVyID0gbmV3IEdvdkZpbmRlclxuZ292X2RldGFpbHMgPSBuZXcgR292RGV0YWlsc1xuZ292X2ZpbmRlci5vbl9zZWxlY3QgPSBnb3ZfZGV0YWlscy5zaG93XG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyMjXG5cbkdvdlNlbGVjdG9yID0gcmVxdWlyZSAnLi9nb3ZzZWxlY3Rvci5jb2ZmZWUnXG4jX2pxZ3MgICAgICAgPSByZXF1aXJlICcuL2pxdWVyeS5nb3ZzZWxlY3Rvci5jb2ZmZWUnXG5UZW1wbGF0ZXMyICAgICAgPSByZXF1aXJlICcuL3RlbXBsYXRlczIuY29mZmVlJ1xuZ292bWFwICAgICAgPSByZXF1aXJlICcuL2dvdm1hcC5jb2ZmZWUnXG4jc2Nyb2xsdG8gPSByZXF1aXJlICcuLi9ib3dlcl9jb21wb25lbnRzL2pxdWVyeS5zY3JvbGxUby9qcXVlcnkuc2Nyb2xsVG8uanMnXG5cbndpbmRvdy5HT1ZXSUtJID1cbiAgc3RhdGVfZmlsdGVyIDogJydcbiAgZ292X3R5cGVfZmlsdGVyIDogJydcbiAgZ292X3R5cGVfZmlsdGVyXzIgOiBbJ0NpdHknLCAnU2Nob29sIERpc3RyaWN0JywgJ1NwZWNpYWwgRGlzdHJpY3QnXVxuXG4gIHNob3dfc2VhcmNoX3BhZ2U6ICgpIC0+XG4gICAgJCh3aW5kb3cpLnNjcm9sbFRvKCcwcHgnLDEwKVxuICAgICQoJyNkYXRhQ29udGFpbmVyJykuaGlkZSgpXG4gICAgJCgnI3NlYXJjaEljb24nKS5oaWRlKClcbiAgICAkKCcjc2VhcmNoQ29udGFpbmVyJykuZmFkZUluKDMwMClcbiAgICBmb2N1c19zZWFyY2hfZmllbGQgNTAwXG5cbiAgc2hvd19kYXRhX3BhZ2U6ICgpIC0+XG4gICAgJCh3aW5kb3cpLnNjcm9sbFRvKCcwcHgnLDEwKVxuICAgICQoJyNzZWFyY2hJY29uJykuc2hvdygpXG4gICAgJCgnI2RhdGFDb250YWluZXInKS5mYWRlSW4oMzAwKVxuICAgICQoJyNzZWFyY2hDb250YWluZXInKS5oaWRlKClcbiAgICAjJCh3aW5kb3cpLnNjcm9sbFRvKCcjcEJhY2tUb1NlYXJjaCcsNjAwKVxuXG4jZ292X3NlbGVjdG9yID0gbmV3IEdvdlNlbGVjdG9yICcudHlwZWFoZWFkJywgJ2RhdGEvaF90eXBlcy5qc29uJywgN1xuZ292X3NlbGVjdG9yID0gbmV3IEdvdlNlbGVjdG9yICcudHlwZWFoZWFkJywgJ2RhdGEvaF90eXBlc19jYS5qc29uJywgN1xuI2dvdl9zZWxlY3RvciA9IG5ldyBHb3ZTZWxlY3RvciAnLnR5cGVhaGVhZCcsICdodHRwOi8vNDYuMTAxLjMuNzkvcmVzdC9kYi9nb3ZzP2ZpbHRlcj1zdGF0ZT0lMjJDQSUyMiZhcHBfbmFtZT1nb3Z3aWtpJmZpZWxkcz1faWQsZ292X25hbWUsZ292X3R5cGUsc3RhdGUmbGltaXQ9NTAwMCcsIDdcbnRlbXBsYXRlcyA9IG5ldyBUZW1wbGF0ZXMyXG5hY3RpdmVfdGFiPVwiXCJcblxuIyBMb2FkIGludHJvZHVjdG9yeSB0ZXh0IGZyb20gdGV4dHMvaW50cm8tdGV4dC5odG1sIHRvICNpbnRyby10ZXh0IGNvbnRhaW5lci5cbiQuZ2V0IFwidGV4dHMvaW50cm8tdGV4dC5odG1sXCIsIChkYXRhKSAtPlxuICAkKFwiI2ludHJvLXRleHRcIikuaHRtbCBkYXRhXG5cblxuR09WV0lLSS5nZXRfY291bnRpZXMgPSBnZXRfY291bnRpZXMgPSAoY2FsbGJhY2spIC0+XG4gICQuYWpheFxuICAgIHVybDogJ2RhdGEvY291bnR5X2dlb2dyYXBoeV9jYS5qc29uJ1xuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICBjYWNoZTogdHJ1ZVxuICAgIHN1Y2Nlc3M6IChjb3VudGllc0pTT04pIC0+XG4gICAgICBjYWxsYmFjayBjb3VudGllc0pTT05cblxuR09WV0lLSS5kcmF3X3BvbHlnb25zID0gZHJhd19wb2x5Z29ucyA9IChjb3VudGllc0pTT04pIC0+XG4gIGZvciBjb3VudHkgaW4gY291bnRpZXNKU09OLmZlYXR1cmVzXG4gICAgZ292bWFwLm1hcC5kcmF3UG9seWdvbih7XG4gICAgICBwYXRoczogY291bnR5Lmdlb21ldHJ5LmNvb3JkaW5hdGVzXG4gICAgICB1c2VHZW9KU09OOiB0cnVlXG4gICAgICBzdHJva2VDb2xvcjogJyM4MDgwODAnXG4gICAgICBzdHJva2VPcGFjaXR5OiAwLjZcbiAgICAgIHN0cm9rZVdlaWdodDogMS41XG4gICAgICBmaWxsQ29sb3I6ICcjRkYwMDAwJ1xuICAgICAgZmlsbE9wYWNpdHk6IDAuMTVcbiAgICAgIGNvdW50eUlkOiBjb3VudHkucHJvcGVydGllcy5faWRcbiAgICAgIGFsdE5hbWU6IGNvdW50eS5wcm9wZXJ0aWVzLmFsdF9uYW1lXG4gICAgICBtYXJrZXI6IG5ldyBNYXJrZXJXaXRoTGFiZWwoe1xuICAgICAgICBwb3NpdGlvbjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZygwLDApLFxuICAgICAgICBkcmFnZ2FibGU6IGZhbHNlLFxuICAgICAgICByYWlzZU9uRHJhZzogZmFsc2UsXG4gICAgICAgIG1hcDogZ292bWFwLm1hcC5tYXAsXG4gICAgICAgIGxhYmVsQ29udGVudDogY291bnR5LnByb3BlcnRpZXMubmFtZSxcbiAgICAgICAgbGFiZWxBbmNob3I6IG5ldyBnb29nbGUubWFwcy5Qb2ludCgtMTUsIDI1KSxcbiAgICAgICAgbGFiZWxDbGFzczogXCJsYWJlbC10b29sdGlwXCIsXG4gICAgICAgIGxhYmVsU3R5bGU6IHtvcGFjaXR5OiAxLjB9LFxuICAgICAgICBpY29uOiBcImh0dHA6Ly9wbGFjZWhvbGQuaXQvMXgxXCIsXG4gICAgICAgIHZpc2libGU6IGZhbHNlXG4gICAgICB9KVxuICAgICAgbW91c2VvdmVyOiAtPlxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoe2ZpbGxDb2xvcjogXCIjMDBGRjAwXCJ9KVxuICAgICAgbW91c2Vtb3ZlOiAoZXZlbnQpIC0+XG4gICAgICAgIHRoaXMubWFya2VyLnNldFBvc2l0aW9uKGV2ZW50LmxhdExuZylcbiAgICAgICAgdGhpcy5tYXJrZXIuc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgbW91c2VvdXQ6IC0+XG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyh7ZmlsbENvbG9yOiBcIiNGRjAwMDBcIn0pXG4gICAgICAgIHRoaXMubWFya2VyLnNldFZpc2libGUoZmFsc2UpXG4gICAgICBjbGljazogLT5cbiAgICAgICAgcm91dGVyLm5hdmlnYXRlIFwiI3t0aGlzLmNvdW50eUlkfVwiXG4gICAgfSlcblxuZ2V0X2NvdW50aWVzIGRyYXdfcG9seWdvbnNcblxud2luZG93LnJlbWVtYmVyX3RhYiA9KG5hbWUpLT4gYWN0aXZlX3RhYiA9IG5hbWVcblxuI3dpbmRvdy5nZW9jb2RlX2FkZHIgPSAoaW5wdXRfc2VsZWN0b3IpLT4gZ292bWFwLmdvY29kZV9hZGRyICQoaW5wdXRfc2VsZWN0b3IpLnZhbCgpXG5cbiQoZG9jdW1lbnQpLm9uICdjbGljaycsICcjZmllbGRUYWJzIGEnLCAoZSkgLT5cbiAgYWN0aXZlX3RhYiA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCd0YWJuYW1lJylcbiAgY29uc29sZS5sb2cgYWN0aXZlX3RhYlxuICAkKFwiI3RhYnNDb250ZW50IC50YWItcGFuZVwiKS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKVxuICAkKCQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCdocmVmJykpLmFkZENsYXNzKFwiYWN0aXZlXCIpXG4gIHRlbXBsYXRlcy5hY3RpdmF0ZSAwLCBhY3RpdmVfdGFiXG5cbiAgaWYgYWN0aXZlX3RhYiA9PSAnRmluYW5jaWFsIFN0YXRlbWVudHMnXG4gICAgZmluVmFsV2lkdGhNYXgxID0gMFxuICAgIGZpblZhbFdpZHRoTWF4MiA9IDBcbiAgICBmaW5WYWxXaWR0aE1heDMgPSAwXG5cbiAgICAkKCcuZmluLXZhbHVlcy1ibG9jayBbZGF0YS1jb2w9XCIxXCJdJykuZmluZCgnLmZpbi12YWwnKS5lYWNoICgpIC0+XG4gICAgICAgIHRoaXNGaW5WYWxXaWR0aCA9ICQodGhpcykud2lkdGgoKVxuXG4gICAgICAgIGlmIHRoaXNGaW5WYWxXaWR0aCA+IGZpblZhbFdpZHRoTWF4MVxuICAgICAgICAgICAgZmluVmFsV2lkdGhNYXgxID0gdGhpc0ZpblZhbFdpZHRoXG5cbiAgICAkKCcuZmluLXZhbHVlcy1ibG9jayBbZGF0YS1jb2w9XCIyXCJdJykuZmluZCgnLmZpbi12YWwnKS5lYWNoICgpIC0+XG4gICAgICAgIHRoaXNGaW5WYWxXaWR0aCA9ICQodGhpcykud2lkdGgoKVxuXG4gICAgICAgIGlmIHRoaXNGaW5WYWxXaWR0aCA+IGZpblZhbFdpZHRoTWF4MlxuICAgICAgICAgICAgZmluVmFsV2lkdGhNYXgyID0gdGhpc0ZpblZhbFdpZHRoXG5cbiAgICAkKCcuZmluLXZhbHVlcy1ibG9jayBbZGF0YS1jb2w9XCIzXCJdJykuZmluZCgnLmZpbi12YWwnKS5lYWNoICgpIC0+XG4gICAgICAgIHRoaXNGaW5WYWxXaWR0aCA9ICQodGhpcykud2lkdGgoKVxuXG4gICAgICAgIGlmIHRoaXNGaW5WYWxXaWR0aCA+IGZpblZhbFdpZHRoTWF4M1xuICAgICAgICAgICAgZmluVmFsV2lkdGhNYXgzID0gdGhpc0ZpblZhbFdpZHRoXG5cbiAgICAkKCcuZmluLXZhbHVlcy1ibG9jayBbZGF0YS1jb2w9XCIxXCJdIC5jdXJyZW5jeS1zaWduJykuY3NzKCdyaWdodCcsIGZpblZhbFdpZHRoTWF4MSArIDI3KVxuICAgICQoJy5maW4tdmFsdWVzLWJsb2NrIFtkYXRhLWNvbD1cIjJcIl0gLmN1cnJlbmN5LXNpZ24nKS5jc3MoJ3JpZ2h0JywgZmluVmFsV2lkdGhNYXgyICsgMjcpXG4gICAgJCgnLmZpbi12YWx1ZXMtYmxvY2sgW2RhdGEtY29sPVwiM1wiXSAuY3VycmVuY3ktc2lnbicpLmNzcygncmlnaHQnLCBmaW5WYWxXaWR0aE1heDMgKyAyNylcblxuXG4kKGRvY3VtZW50KS50b29sdGlwKHtzZWxlY3RvcjogXCJbY2xhc3M9J21lZGlhLXRvb2x0aXAnXVwiLHRyaWdnZXI6J2NsaWNrJ30pXG5cbmFjdGl2YXRlX3RhYiA9KCkgLT5cbiAgJChcIiNmaWVsZFRhYnMgYVtocmVmPScjdGFiI3thY3RpdmVfdGFifSddXCIpLnRhYignc2hvdycpXG5cbmdvdl9zZWxlY3Rvci5vbl9zZWxlY3RlZCA9IChldnQsIGRhdGEsIG5hbWUpIC0+XG4gICNyZW5kZXJEYXRhICcjZGV0YWlscycsIGRhdGFcbiAgZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzIGRhdGEuX2lkLCAyNSwgKGRhdGEyLCB0ZXh0U3RhdHVzLCBqcVhIUikgLT5cbiAgICBkYXRhLmVsZWN0ZWRfb2ZmaWNpYWxzID0gZGF0YTJcbiAgICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIGRhdGEpXG4gICAgI2dldF9yZWNvcmQgXCJpbmNfaWQ6I3tkYXRhW1wiaW5jX2lkXCJdfVwiXG4gICAgZ2V0X3JlY29yZDIgZGF0YVtcIl9pZFwiXVxuICAgIGFjdGl2YXRlX3RhYigpXG4gICAgR09WV0lLSS5zaG93X2RhdGFfcGFnZSgpXG4gICAgcm91dGVyLm5hdmlnYXRlIFwiI3tkYXRhLl9pZH1cIlxuICAgIHJldHVyblxuXG5cbmdldF9yZWNvcmQgPSAocXVlcnkpIC0+XG4gICQuYWpheFxuICAgIHVybDogXCJodHRwczovL2FwaS5tb25nb2xhYi5jb20vYXBpLzEvZGF0YWJhc2VzL2dvdndpa2kvY29sbGVjdGlvbnMvZ292cy8/cT17I3txdWVyeX19JmY9e19pZDowfSZsPTEmYXBpS2V5PTBZNVhfUWsydU9KUmRISldKS1NSV2s2bDZKcVZUUzJ5XCJcbiAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgY2FjaGU6IHRydWVcbiAgICBzdWNjZXNzOiAoZGF0YSkgLT5cbiAgICAgIGlmIGRhdGEubGVuZ3RoXG4gICAgICAgICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgZGF0YVswXSlcbiAgICAgICAgYWN0aXZhdGVfdGFiKClcbiAgICAgICAgI2dvdm1hcC5nZW9jb2RlIGRhdGFbMF1cbiAgICAgIHJldHVyblxuICAgIGVycm9yOihlKSAtPlxuICAgICAgY29uc29sZS5sb2cgZVxuXG5cbmdldF9yZWNvcmQyID0gKHJlY2lkKSAtPlxuICAkLmFqYXhcbiAgICAjdXJsOiBcImh0dHBzOi8vZHNwLWdvdndpa2kuY2xvdWQuZHJlYW1mYWN0b3J5LmNvbTo0NDMvcmVzdC9nb3Z3aWtpX2FwaS9nb3ZzLyN7cmVjaWR9XCJcbiAgICB1cmw6IFwiaHR0cDovLzQ2LjEwMS4zLjc5OjgwL3Jlc3QvZGIvZ292cy8je3JlY2lkfVwiXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgIGhlYWRlcnM6IHtcIlgtRHJlYW1GYWN0b3J5LUFwcGxpY2F0aW9uLU5hbWVcIjpcImdvdndpa2lcIn1cbiAgICBjYWNoZTogdHJ1ZVxuICAgIHN1Y2Nlc3M6IChkYXRhKSAtPlxuICAgICAgaWYgZGF0YVxuICAgICAgICBnZXRfZmluYW5jaWFsX3N0YXRlbWVudHMgZGF0YS5faWQsIChkYXRhMiwgdGV4dFN0YXR1cywganFYSFIpIC0+XG4gICAgICAgICAgZGF0YS5maW5hbmNpYWxfc3RhdGVtZW50cyA9IGRhdGEyXG4gICAgICAgICAgZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzIGRhdGEuX2lkLCAyNSwgKGRhdGEzLCB0ZXh0U3RhdHVzMiwganFYSFIyKSAtPlxuICAgICAgICAgICAgZGF0YS5lbGVjdGVkX29mZmljaWFscyA9IGRhdGEzXG4gICAgICAgICAgICBnZXRfbWF4X3JhbmtzIChtYXhfcmFua3NfcmVzcG9uc2UpIC0+XG4gICAgICAgICAgICAgIGRhdGEubWF4X3JhbmtzID0gbWF4X3JhbmtzX3Jlc3BvbnNlLnJlY29yZFswXVxuICAgICAgICAgICAgICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIGRhdGEpXG4gICAgICAgICAgICAgIGFjdGl2YXRlX3RhYigpXG4gICAgICAgICAgICAjZ292bWFwLmdlb2NvZGUgZGF0YVswXVxuICAgICAgcmV0dXJuXG4gICAgZXJyb3I6KGUpIC0+XG4gICAgICBjb25zb2xlLmxvZyBlXG5cblxuZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzID0gKGdvdl9pZCwgbGltaXQsIG9uc3VjY2VzcykgLT5cbiAgJC5hamF4XG4gICAgdXJsOlwiaHR0cDovLzQ2LjEwMS4zLjc5OjgwL3Jlc3QvZGIvZWxlY3RlZF9vZmZpY2lhbHNcIlxuICAgIGRhdGE6XG4gICAgICBmaWx0ZXI6XCJnb3ZzX2lkPVwiICsgZ292X2lkXG4gICAgICBmaWVsZHM6XCJnb3ZzX2lkLHRpdGxlLGZ1bGxfbmFtZSxlbWFpbF9hZGRyZXNzLHBob3RvX3VybCx0ZXJtX2V4cGlyZXMsdGVsZXBob25lX251bWJlclwiXG4gICAgICBhcHBfbmFtZTpcImdvdndpa2lcIlxuICAgICAgb3JkZXI6XCJkaXNwbGF5X29yZGVyXCJcbiAgICAgIGxpbWl0OmxpbWl0XG5cbiAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgY2FjaGU6IHRydWVcbiAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcbiAgICBlcnJvcjooZSkgLT5cbiAgICAgIGNvbnNvbGUubG9nIGVcblxuZ2V0X2ZpbmFuY2lhbF9zdGF0ZW1lbnRzID0gKGdvdl9pZCwgb25zdWNjZXNzKSAtPlxuICAkLmFqYXhcbiAgICB1cmw6XCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9fcHJvYy9nZXRfZmluYW5jaWFsX3N0YXRlbWVudHNcIlxuICAgIGRhdGE6XG4gICAgICBhcHBfbmFtZTpcImdvdndpa2lcIlxuICAgICAgb3JkZXI6XCJjYXB0aW9uX2NhdGVnb3J5LGRpc3BsYXlfb3JkZXJcIlxuICAgICAgcGFyYW1zOiBbXG4gICAgICAgIG5hbWU6IFwiZ292c19pZFwiXG4gICAgICAgIHBhcmFtX3R5cGU6IFwiSU5cIlxuICAgICAgICB2YWx1ZTogZ292X2lkXG4gICAgICBdXG5cbiAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgY2FjaGU6IHRydWVcbiAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcbiAgICBlcnJvcjooZSkgLT5cbiAgICAgIGNvbnNvbGUubG9nIGVcblxuXG5nZXRfbWF4X3JhbmtzID0gKG9uc3VjY2VzcykgLT5cbiAgJC5hamF4XG4gICAgdXJsOidodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9tYXhfcmFua3MnXG4gICAgZGF0YTpcbiAgICAgIGFwcF9uYW1lOidnb3Z3aWtpJ1xuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICBjYWNoZTogdHJ1ZVxuICAgIHN1Y2Nlc3M6IG9uc3VjY2Vzc1xuXG53aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZCA9KHJlYyk9PlxuICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIHJlYylcbiAgYWN0aXZhdGVfdGFiKClcbiAgR09WV0lLSS5zaG93X2RhdGFfcGFnZSgpXG4gIHJvdXRlci5uYXZpZ2F0ZShyZWMuX2lkKVxuXG5cbndpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkMiA9KHJlYyk9PlxuICBnZXRfZWxlY3RlZF9vZmZpY2lhbHMgcmVjLl9pZCwgMjUsIChkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikgLT5cbiAgICByZWMuZWxlY3RlZF9vZmZpY2lhbHMgPSBkYXRhXG4gICAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCByZWMpXG4gICAgZ2V0X3JlY29yZDIgcmVjLl9pZFxuICAgIGFjdGl2YXRlX3RhYigpXG4gICAgR09WV0lLSS5zaG93X2RhdGFfcGFnZSgpXG4gICAgcm91dGVyLm5hdmlnYXRlIFwiI3tyZWMuYWx0X25hbWUucmVwbGFjZSgvIC9nLCdfJyl9XCJcblxuXG5cbiMjI1xud2luZG93LnNob3dfcmVjID0gKHJlYyktPlxuICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIHJlYylcbiAgYWN0aXZhdGVfdGFiKClcbiMjI1xuXG5idWlsZF9zZWxlY3RvciA9IChjb250YWluZXIsIHRleHQsIGNvbW1hbmQsIHdoZXJlX3RvX3N0b3JlX3ZhbHVlICkgLT5cbiAgJC5hamF4XG4gICAgdXJsOiAnaHR0cHM6Ly9hcGkubW9uZ29sYWIuY29tL2FwaS8xL2RhdGFiYXNlcy9nb3Z3aWtpL3J1bkNvbW1hbmQ/YXBpS2V5PTBZNVhfUWsydU9KUmRISldKS1NSV2s2bDZKcVZUUzJ5J1xuICAgIHR5cGU6ICdQT1NUJ1xuICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICBkYXRhOiBjb21tYW5kICNKU09OLnN0cmluZ2lmeShjb21tYW5kKVxuICAgIGNhY2hlOiB0cnVlXG4gICAgc3VjY2VzczogKGRhdGEpID0+XG4gICAgICAjYT0kLmV4dGVuZCB0cnVlIFtdLGRhdGFcbiAgICAgIHZhbHVlcz1kYXRhLnZhbHVlc1xuICAgICAgYnVpbGRfc2VsZWN0X2VsZW1lbnQgY29udGFpbmVyLCB0ZXh0LCB2YWx1ZXMuc29ydCgpLCB3aGVyZV90b19zdG9yZV92YWx1ZVxuICAgICAgcmV0dXJuXG4gICAgZXJyb3I6KGUpIC0+XG4gICAgICBjb25zb2xlLmxvZyBlXG5cblxuYnVpbGRfc2VsZWN0X2VsZW1lbnQgPSAoY29udGFpbmVyLCB0ZXh0LCBhcnIsIHdoZXJlX3RvX3N0b3JlX3ZhbHVlICkgLT5cbiAgcyAgPSBcIjxzZWxlY3QgY2xhc3M9J2Zvcm0tY29udHJvbCcgc3R5bGU9J21heHdpZHRoOjE2MHB4Oyc+PG9wdGlvbiB2YWx1ZT0nJz4je3RleHR9PC9vcHRpb24+XCJcbiAgcyArPSBcIjxvcHRpb24gdmFsdWU9JyN7dn0nPiN7dn08L29wdGlvbj5cIiBmb3IgdiBpbiBhcnIgd2hlbiB2XG4gIHMgKz0gXCI8L3NlbGVjdD5cIlxuICBzZWxlY3QgPSAkKHMpXG4gICQoY29udGFpbmVyKS5hcHBlbmQoc2VsZWN0KVxuXG4gICMgc2V0IGRlZmF1bHQgJ0NBJ1xuICBpZiB0ZXh0IGlzICdTdGF0ZS4uJ1xuICAgIHNlbGVjdC52YWwgJ0NBJ1xuICAgIHdpbmRvdy5HT1ZXSUtJLnN0YXRlX2ZpbHRlcj0nQ0EnXG4gICAgZ292bWFwLm9uX2JvdW5kc19jaGFuZ2VkX2xhdGVyKClcblxuICBzZWxlY3QuY2hhbmdlIChlKSAtPlxuICAgIGVsID0gJChlLnRhcmdldClcbiAgICB3aW5kb3cuR09WV0lLSVt3aGVyZV90b19zdG9yZV92YWx1ZV0gPSBlbC52YWwoKVxuICAgICQoJy5nb3YtY291bnRlcicpLnRleHQgZ292X3NlbGVjdG9yLmNvdW50X2dvdnMoKVxuICAgIGdvdm1hcC5vbl9ib3VuZHNfY2hhbmdlZCgpXG5cblxuYWRqdXN0X3R5cGVhaGVhZF93aWR0aCA9KCkgLT5cbiAgaW5wID0gJCgnI215aW5wdXQnKVxuICBwYXIgPSAkKCcjdHlwZWFoZWQtY29udGFpbmVyJylcbiAgaW5wLndpZHRoIHBhci53aWR0aCgpXG5cblxuXG5cbnN0YXJ0X2FkanVzdGluZ190eXBlYWhlYWRfd2lkdGggPSgpIC0+XG4gICQod2luZG93KS5yZXNpemUgLT5cbiAgICBhZGp1c3RfdHlwZWFoZWFkX3dpZHRoKClcblxuXG4jIGFkZCBsaXZlIHJlbG9hZCB0byB0aGUgc2l0ZS4gRm9yIGRldmVsb3BtZW50IG9ubHkuXG5saXZlcmVsb2FkID0gKHBvcnQpIC0+XG4gIHVybD13aW5kb3cubG9jYXRpb24ub3JpZ2luLnJlcGxhY2UgLzpbXjpdKiQvLCBcIlwiXG4gICQuZ2V0U2NyaXB0IHVybCArIFwiOlwiICsgcG9ydCwgPT5cbiAgICAkKCdib2R5JykuYXBwZW5kIFwiXCJcIlxuICAgIDxkaXYgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO3otaW5kZXg6MTAwMDtcbiAgICB3aWR0aDoxMDAlOyB0b3A6MDtjb2xvcjpyZWQ7IHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICBwYWRkaW5nOjFweDtmb250LXNpemU6MTBweDtsaW5lLWhlaWdodDoxJz5saXZlPC9kaXY+XG4gICAgXCJcIlwiXG5cbmZvY3VzX3NlYXJjaF9maWVsZCA9IChtc2VjKSAtPlxuICBzZXRUaW1lb3V0ICgtPiAkKCcjbXlpbnB1dCcpLmZvY3VzKCkpICxtc2VjXG5cblxuXG4jIHF1aWNrIGFuZCBkaXJ0eSBmaXggZm9yIGJhY2sgYnV0dG9uIGluIGJyb3dzZXJcbndpbmRvdy5vbmhhc2hjaGFuZ2UgPSAoZSkgLT5cbiAgaD13aW5kb3cubG9jYXRpb24uaGFzaFxuICAjY29uc29sZS5sb2cgXCJvbkhhc2hDaGFuZ2UgI3tofVwiXG4gICNjb25zb2xlLmxvZyBlXG4gIGlmIG5vdCBoXG4gICAgR09WV0lLSS5zaG93X3NlYXJjaF9wYWdlKClcblxuIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuI3RlbXBsYXRlcy5sb2FkX3RlbXBsYXRlIFwidGFic1wiLCBcImNvbmZpZy90YWJsYXlvdXQuanNvblwiXG5cblxuIyBmaXJlIGNsaWVudC1zaWRlIFVSTCByb3V0aW5nXG5cbnJvdXRlciA9IG5ldyBHcmFwbmVsXG5cbnJvdXRlci5nZXQgJzppZC86dXNlcl9pZCcsIChyZXEsIGV2ZW50KSAtPlxuICAgIGdvdl9pZCA9IHJlcS5wYXJhbXMuaWQuc3Vic3RyKDApXG4gICAgdXNlcl9pZCA9IHJlcS5wYXJhbXMudXNlcl9pZFxuICAgIHRlbXBsYXRlcy5sb2FkX2Z1c2lvbl90ZW1wbGF0ZSBcInRhYnNcIiwgXCJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9mdXNpb250YWJsZXMvdjIvcXVlcnk/c3FsPVNFTEVDVCUyMColMjBGUk9NJTIwMXoyb1hRRVlRM3AyT29NSThWNWdLZ0hXQjVUejk5MEJyUTF4YzF0Vm8ma2V5PUFJemFTeUNYRFF5TURwR0EyZzNRanV2NENEdjd6UmotaXg0SVFKQVwiXG4gICAgJC5hamF4XG4gICAgICAgIHVybDpcImh0dHA6Ly80Ni4xMDEuMy43OTo4MC9yZXN0L2RiL2dvdnNcIlxuICAgICAgICBkYXRhOlxuICAgICAgICAgICAgZmlsdGVyOiBcIl9pZD1cIiArIGdvdl9pZFxuICAgICAgICAgICAgZmllbGRzOiBcImdvdl9uYW1lXCJcbiAgICAgICAgICAgIGFwcF9uYW1lOlwiZ292d2lraVwiXG4gICAgICAgIHN1Y2Nlc3M6IChkYXRhKSAtPlxuICAgICAgICAgICAgZ292X25hbWUgPSBkYXRhLnJlY29yZFswXS5nb3ZfbmFtZVxuXG4gICAgICAgICAgICBkbyAoKSA9PlxuICAgICAgICAgICAgICAgICQuYWpheFxuICAgICAgICAgICAgICAgICAgICB1cmw6IFwiaHR0cDovLzQ2LjEwMS4zLjc5OjgwL3Jlc3QvZGIvX3Byb2MvZ2V0Vm90ZXM/YXBwX25hbWU9Z292d2lraVwiXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBfbmFtZTogXCJnb3Z3aWtpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtczogW3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJpZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicGFyYW1fdHlwZVwiOiBcIklOVFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogdXNlcl9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJqc29uXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJsZW5ndGhcIjogMFxuICAgICAgICAgICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiAoZGF0YSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZvdGVzID0gZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgZG8gKGdvdl9uYW1lLCB2b3RlcykgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmFqYXhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOlwiaHR0cDovLzQ2LjEwMS4zLjc5OjgwL3Jlc3QvZGIvZWxlY3RlZF9vZmZpY2lhbHNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBcImVsZWN0ZWRfb2ZmaWNpYWxfaWQ9XCIgKyB1c2VyX2lkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBfbmFtZTpcImdvdndpa2lcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGltaXQ6IDI1XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGU6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogKGRhdGEpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJzb24gPSBkYXRhLnJlY29yZFswXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVyc29uLmdvdl9uYW1lID0gZ292X25hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcnNvbi52b3RlcyA9IHZvdGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyBwZXJzb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRwbCA9ICQoJyNwZXJzb24taW5mby10ZW1wbGF0ZScpLmh0bWwoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcGlsZWRUZW1wbGF0ZSA9IEhhbmRsZWJhcnMuY29tcGlsZSh0cGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sID0gY29tcGlsZWRUZW1wbGF0ZShwZXJzb24pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcjc2VhcmNoQ29udGFpbmVyJykuaHRtbCBodG1sXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy52b3RlJykub24gJ2NsaWNrJywgKGUpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSBlLmN1cnJlbnRUYXJnZXQuaWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcjY29udmVyc2F0aW9uJykubW9kYWwgJ3Nob3cnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzZXQgaWQsICdodHRwOi8vZ292d2lraS51cycgKyAnLycgKyBpZCwgaWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6KGUpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyBlXG5cbiMgUmVmcmVzaCBEaXNxdXMgdGhyZWFkXG5yZXNldCA9IChuZXdJZGVudGlmaWVyLCBuZXdVcmwsIG5ld1RpdGxlKSAtPlxuICAgIERJU1FVUy5yZXNldFxuICAgICAgICByZWxvYWQ6IHRydWUsXG4gICAgICAgIGNvbmZpZzogKCkgLT5cbiAgICAgICAgICAgIHRoaXMucGFnZS5pZGVudGlmaWVyID0gbmV3SWRlbnRpZmllclxuICAgICAgICAgICAgdGhpcy5wYWdlLnVybCA9IG5ld1VybFxuICAgICAgICAgICAgdGhpcy5wYWdlLnRpdGxlID0gbmV3VGl0bGVcblxucm91dGVyLmdldCAnOmlkJywgKHJlcSwgZXZlbnQpIC0+XG4gICAgaWQgPSByZXEucGFyYW1zLmlkXG4gICAgdGVtcGxhdGVzLmxvYWRfZnVzaW9uX3RlbXBsYXRlIFwidGFic1wiLCBcImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2Z1c2lvbnRhYmxlcy92Mi9xdWVyeT9zcWw9U0VMRUNUJTIwKiUyMEZST00lMjAxejJvWFFFWVEzcDJPb01JOFY1Z0tnSFdCNVR6OTkwQnJRMXhjMXRWbyZrZXk9QUl6YVN5Q1hEUXlNRHBHQTJnM1FqdXY0Q0R2N3pSai1peDRJUUpBXCJcbiAgICBjb25zb2xlLmxvZyBcIlJPVVRFUiBJRD0je2lkfVwiXG4gICAgZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzID0gKGdvdl9pZCwgbGltaXQsIG9uc3VjY2VzcykgLT5cbiAgICAgICAgJC5hamF4XG4gICAgICAgICAgICB1cmw6XCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9lbGVjdGVkX29mZmljaWFsc1wiXG4gICAgICAgICAgICBkYXRhOlxuICAgICAgICAgICAgICAgIGZpbHRlcjpcImdvdnNfaWQ9XCIgKyBnb3ZfaWRcbiAgICAgICAgICAgICAgICBhcHBfbmFtZTpcImdvdndpa2lcIlxuICAgICAgICAgICAgICAgIG9yZGVyOlwiZGlzcGxheV9vcmRlclwiXG4gICAgICAgICAgICAgICAgbGltaXQ6bGltaXRcblxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICAgICAgY2FjaGU6IHRydWVcbiAgICAgICAgICAgIHN1Y2Nlc3M6IG9uc3VjY2Vzc1xuICAgICAgICAgICAgZXJyb3I6KGUpIC0+XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cgZVxuICAgIGlmIGlzTmFOKGlkKVxuICAgICAgICBpZCA9IGlkLnJlcGxhY2UoL18vZywnICcpXG4gICAgICAgIGJ1aWxkX2RhdGEgPSAoaWQsIGxpbWl0LCBvbnN1Y2Nlc3MpIC0+XG4gICAgICAgICAgICAkLmFqYXhcbiAgICAgICAgICAgICAgICB1cmw6XCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9nb3ZzXCJcbiAgICAgICAgICAgICAgICBkYXRhOlxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXI6XCJhbHRfbmFtZT0nI3tpZH0nXCJcbiAgICAgICAgICAgICAgICAgICAgYXBwX25hbWU6XCJnb3Z3aWtpXCJcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgICAgICAgICAgICAgY2FjaGU6IHRydWVcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiAoZGF0YSkgLT5cbiAgICAgICAgICAgICAgICAgICAgZWxlY3RlZF9vZmZpY2lhbHMgPSBnZXRfZWxlY3RlZF9vZmZpY2lhbHMgZGF0YS5yZWNvcmRbMF0uX2lkLCAyNSwgKGVsZWN0ZWRfb2ZmaWNpYWxzX2RhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgZ292X2lkID0gZGF0YS5yZWNvcmRbMF0uX2lkXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhID0gbmV3IE9iamVjdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLl9pZCA9IGdvdl9pZFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5lbGVjdGVkX29mZmljaWFscyA9IGVsZWN0ZWRfb2ZmaWNpYWxzX2RhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEuZ292X25hbWUgPSBcIlwiXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLmdvdl90eXBlID0gXCJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5zdGF0ZSA9IFwiXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgZGF0YSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldF9yZWNvcmQyIGRhdGEuX2lkXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmF0ZV90YWIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgR09WV0lLSS5zaG93X2RhdGFfcGFnZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICBlcnJvcjooZSkgLT5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cgZVxuICAgICAgICBidWlsZF9kYXRhKGlkKVxuICAgIGVsc2VcbiAgICAgICAgZWxlY3RlZF9vZmZpY2lhbHMgPSBnZXRfZWxlY3RlZF9vZmZpY2lhbHMgaWQsIDI1LCAoZWxlY3RlZF9vZmZpY2lhbHNfZGF0YSwgdGV4dFN0YXR1cywganFYSFIpIC0+XG4gICAgICAgICAgICBkYXRhID0gbmV3IE9iamVjdCgpXG4gICAgICAgICAgICBkYXRhLl9pZCA9IGlkXG4gICAgICAgICAgICBkYXRhLmVsZWN0ZWRfb2ZmaWNpYWxzID0gZWxlY3RlZF9vZmZpY2lhbHNfZGF0YVxuICAgICAgICAgICAgZGF0YS5nb3ZfbmFtZSA9IFwiXCJcbiAgICAgICAgICAgIGRhdGEuZ292X3R5cGUgPSBcIlwiXG4gICAgICAgICAgICBkYXRhLnN0YXRlID0gXCJcIlxuICAgICAgICAgICAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCBkYXRhKVxuICAgICAgICAgICAgZ2V0X3JlY29yZDIgZGF0YS5faWRcbiAgICAgICAgICAgIGFjdGl2YXRlX3RhYigpXG4gICAgICAgICAgICBHT1ZXSUtJLnNob3dfZGF0YV9wYWdlKClcbiAgICAgICAgICAgIHJldHVyblxuXG5yb3V0ZXIuZ2V0ICcnLCAocmVxLCBldmVudCkgLT5cbiAgICB0ZW1wbGF0ZXMubG9hZF9mdXNpb25fdGVtcGxhdGUgXCJ0YWJzXCIsIFwiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vZnVzaW9udGFibGVzL3YyL3F1ZXJ5P3NxbD1TRUxFQ1QlMjAqJTIwRlJPTSUyMDF6Mm9YUUVZUTNwMk9vTUk4VjVnS2dIV0I1VHo5OTBCclExeGMxdFZvJmtleT1BSXphU3lDWERReU1EcEdBMmczUWp1djRDRHY3elJqLWl4NElRSkFcIlxuXG5idWlsZF9zZWxlY3RvcignLnN0YXRlLWNvbnRhaW5lcicgLCAnU3RhdGUuLicgLCAne1wiZGlzdGluY3RcIjogXCJnb3ZzXCIsXCJrZXlcIjpcInN0YXRlXCJ9JyAsICdzdGF0ZV9maWx0ZXInKVxuYnVpbGRfc2VsZWN0b3IoJy5nb3YtdHlwZS1jb250YWluZXInICwgJ3R5cGUgb2YgZ292ZXJubWVudC4uJyAsICd7XCJkaXN0aW5jdFwiOiBcImdvdnNcIixcImtleVwiOlwiZ292X3R5cGVcIn0nICwgJ2dvdl90eXBlX2ZpbHRlcicpXG5cbmFkanVzdF90eXBlYWhlYWRfd2lkdGgoKVxuc3RhcnRfYWRqdXN0aW5nX3R5cGVhaGVhZF93aWR0aCgpXG5cbiQoJyNidG5CYWNrVG9TZWFyY2gnKS5jbGljayAoZSktPlxuICBlLnByZXZlbnREZWZhdWx0KClcbiAgR09WV0lLSS5zaG93X3NlYXJjaF9wYWdlKClcblxuI2ZvY3VzX3NlYXJjaF9maWVsZCA1MDBcblxuXG5cbmxpdmVyZWxvYWQgXCI5MDkwXCJcblxuIiwiXG5cblxuIyBUYWtlcyBhbiBhcnJheSBvZiBkb2NzIHRvIHNlYXJjaCBpbi5cbiMgUmV0dXJucyBhIGZ1bmN0aW9ucyB0aGF0IHRha2VzIDIgcGFyYW1zIFxuIyBxIC0gcXVlcnkgc3RyaW5nIGFuZCBcbiMgY2IgLSBjYWxsYmFjayB0aGF0IHdpbGwgYmUgY2FsbGVkIHdoZW4gdGhlIHNlYXJjaCBpcyBkb25lLlxuIyBjYiByZXR1cm5zIGFuIGFycmF5IG9mIG1hdGNoaW5nIGRvY3VtZW50cy5cbiMgbXVtX2l0ZW1zIC0gbWF4IG51bWJlciBvZiBmb3VuZCBpdGVtcyB0byBzaG93XG5RdWVyeU1hdGhlciA9IChkb2NzLCBudW1faXRlbXM9NSkgLT5cbiAgKHEsIGNiKSAtPlxuICAgIHRlc3Rfc3RyaW5nID0ocywgcmVncykgLT5cbiAgICAgIChpZiBub3Qgci50ZXN0KHMpIHRoZW4gcmV0dXJuIGZhbHNlKSAgZm9yIHIgaW4gcmVnc1xuICAgICAgcmV0dXJuIHRydWVcblxuICAgIFt3b3JkcyxyZWdzXSA9IGdldF93b3Jkc19yZWdzIHFcbiAgICBtYXRjaGVzID0gW11cbiAgICAjIGl0ZXJhdGUgdGhyb3VnaCB0aGUgcG9vbCBvZiBkb2NzIGFuZCBmb3IgYW55IHN0cmluZyB0aGF0XG4gICAgIyBjb250YWlucyB0aGUgc3Vic3RyaW5nIGBxYCwgYWRkIGl0IHRvIHRoZSBgbWF0Y2hlc2AgYXJyYXlcblxuICAgIGZvciBkIGluIGRvY3NcbiAgICAgIGlmIG1hdGNoZXMubGVuZ3RoID49IG51bV9pdGVtcyB0aGVuIGJyZWFrXG4gICAgICBpZiBHT1ZXSUtJLnN0YXRlX2ZpbHRlciBhbmQgZC5zdGF0ZSBpc250IEdPVldJS0kuc3RhdGVfZmlsdGVyIHRoZW4gY29udGludWVcbiAgICAgIGlmIEdPVldJS0kuZ292X3R5cGVfZmlsdGVyIGFuZCBkLmdvdl90eXBlIGlzbnQgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXIgdGhlbiBjb250aW51ZVxuXG4gICAgICBpZiB0ZXN0X3N0cmluZyhkLmdvdl9uYW1lLCByZWdzKSBcbiAgICAgICAgbWF0Y2hlcy5wdXNoICQuZXh0ZW5kKHt9LCBkKVxuICAgICAgI2lmIHRlc3Rfc3RyaW5nKFwiI3tkLmdvdl9uYW1lfSAje2Quc3RhdGV9ICN7ZC5nb3ZfdHlwZX0gI3tkLmluY19pZH1cIiwgcmVncykgdGhlbiBtYXRjaGVzLnB1c2ggJC5leHRlbmQoe30sIGQpXG4gICAgXG4gICAgc2VsZWN0X3RleHQgbWF0Y2hlcywgd29yZHMsIHJlZ3NcbiAgICBjYiBtYXRjaGVzXG4gICAgcmV0dXJuXG4gXG5cbiMgaW5zZXJ0cyA8c3Ryb25nPiBlbGVtZW50c2UgaW4gYXJyYXlcbnNlbGVjdF90ZXh0ID0gKGNsb25lcyx3b3JkcyxyZWdzKSAtPlxuICBmb3IgZCBpbiBjbG9uZXNcbiAgICBkLmdvdl9uYW1lPXN0cm9uZ2lmeShkLmdvdl9uYW1lLCB3b3JkcywgcmVncylcbiAgICAjZC5zdGF0ZT1zdHJvbmdpZnkoZC5zdGF0ZSwgd29yZHMsIHJlZ3MpXG4gICAgI2QuZ292X3R5cGU9c3Ryb25naWZ5KGQuZ292X3R5cGUsIHdvcmRzLCByZWdzKVxuICBcbiAgcmV0dXJuIGNsb25lc1xuXG5cblxuIyBpbnNlcnRzIDxzdHJvbmc+IGVsZW1lbnRzZVxuc3Ryb25naWZ5ID0gKHMsIHdvcmRzLCByZWdzKSAtPlxuICByZWdzLmZvckVhY2ggKHIsaSkgLT5cbiAgICBzID0gcy5yZXBsYWNlIHIsIFwiPGI+I3t3b3Jkc1tpXX08L2I+XCJcbiAgcmV0dXJuIHNcblxuIyByZW1vdmVzIDw+IHRhZ3MgZnJvbSBhIHN0cmluZ1xuc3RyaXAgPSAocykgLT5cbiAgcy5yZXBsYWNlKC88W148Pl0qPi9nLCcnKVxuXG5cbiMgYWxsIHRpcm1zIHNwYWNlcyBmcm9tIGJvdGggc2lkZXMgYW5kIG1ha2UgY29udHJhY3RzIHNlcXVlbmNlcyBvZiBzcGFjZXMgdG8gMVxuZnVsbF90cmltID0gKHMpIC0+XG4gIHNzPXMudHJpbSgnJytzKVxuICBzcz1zcy5yZXBsYWNlKC8gKy9nLCcgJylcblxuIyByZXR1cm5zIGFuIGFycmF5IG9mIHdvcmRzIGluIGEgc3RyaW5nXG5nZXRfd29yZHMgPSAoc3RyKSAtPlxuICBmdWxsX3RyaW0oc3RyKS5zcGxpdCgnICcpXG5cblxuZ2V0X3dvcmRzX3JlZ3MgPSAoc3RyKSAtPlxuICB3b3JkcyA9IGdldF93b3JkcyBzdHJcbiAgcmVncyA9IHdvcmRzLm1hcCAodyktPiBuZXcgUmVnRXhwKFwiI3t3fVwiLCdpJylcbiAgW3dvcmRzLHJlZ3NdXG5cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVyeU1hdGhlclxuXG4iLCJcbiMjI1xuIyBmaWxlOiB0ZW1wbGF0ZXMyLmNvZmZlZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jXG4jIENsYXNzIHRvIG1hbmFnZSB0ZW1wbGF0ZXMgYW5kIHJlbmRlciBkYXRhIG9uIGh0bWwgcGFnZS5cbiNcbiMgVGhlIG1haW4gbWV0aG9kIDogcmVuZGVyKGRhdGEpLCBnZXRfaHRtbChkYXRhKVxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMjI1xuXG5cblxuIyBMT0FEIEZJRUxEIE5BTUVTXG5maWVsZE5hbWVzID0ge31cbmZpZWxkTmFtZXNIZWxwID0ge31cblxuXG5yZW5kZXJfZmllbGRfdmFsdWUgPSAobixtYXNrLGRhdGEpIC0+XG4gIHY9ZGF0YVtuXVxuICBpZiBub3QgZGF0YVtuXVxuICAgIHJldHVybiAnJ1xuXG4gIGlmIG4gPT0gXCJ3ZWJfc2l0ZVwiXG4gICAgcmV0dXJuIFwiPGEgdGFyZ2V0PSdfYmxhbmsnIGhyZWY9JyN7dn0nPiN7dn08L2E+XCJcbiAgZWxzZVxuICAgIGlmICcnICE9IG1hc2tcbiAgICAgIGlmIGRhdGFbbisnX3JhbmsnXSBhbmQgZGF0YS5tYXhfcmFua3MgYW5kIGRhdGEubWF4X3JhbmtzW24rJ19tYXhfcmFuayddXG4gICAgICAgIHYgPSBudW1lcmFsKHYpLmZvcm1hdChtYXNrKVxuICAgICAgICByZXR1cm4gXCIje3Z9IDxzcGFuIGNsYXNzPSdyYW5rJz4oI3tkYXRhW24rJ19yYW5rJ119IG9mICN7ZGF0YS5tYXhfcmFua3NbbisnX21heF9yYW5rJ119KTwvc3Bhbj5cIlxuICAgICAgaWYgbiA9PSBcIm51bWJlcl9vZl9mdWxsX3RpbWVfZW1wbG95ZWVzXCJcbiAgICAgICAgcmV0dXJuIG51bWVyYWwodikuZm9ybWF0KCcwLDAnKVxuICAgICAgcmV0dXJuIG51bWVyYWwodikuZm9ybWF0KG1hc2spXG4gICAgZWxzZVxuICAgICAgaWYgdi5sZW5ndGggPiAyMCBhbmRcbiAgICAgIG4gPT0gXCJvcGVuX2Vucm9sbG1lbnRfc2Nob29sc1wiXG4gICAgICB0aGVuIHYgPSB2LnN1YnN0cmluZygwLCAxOSkgKyBcIjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2NvbG9yOiMwNzRkNzEnICB0aXRsZT0nI3t2fSc+JmhlbGxpcDs8L2Rpdj5cIlxuICAgICAgaWYgdi5sZW5ndGggPiAyMCBhbmRcbiAgICAgIG4gPT0gXCJwYXJlbnRfdHJpZ2dlcl9lbGlnaWJsZV9zY2hvb2xzXCJcbiAgICAgIHRoZW4gdiA9IHYuc3Vic3RyaW5nKDAsIDE5KSArIFwiPGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7Y29sb3I6IzA3NGQ3MScgIHRpdGxlPScje3Z9Jz4maGVsbGlwOzwvZGl2PlwiXG4gICAgICBlbHNlXG4gICAgICAgIGlmIHYubGVuZ3RoID4gMjFcbiAgICAgICAgdGhlbiB2ID0gdi5zdWJzdHJpbmcoMCwgMjEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIHZcblxuXG5yZW5kZXJfZmllbGRfbmFtZV9oZWxwID0gKGZOYW1lKSAtPlxuICAjaWYgZmllbGROYW1lc0hlbHBbZk5hbWVdXG4gICAgcmV0dXJuIGZpZWxkTmFtZXNIZWxwW2ZOYW1lXVxuXG5yZW5kZXJfZmllbGRfbmFtZSA9IChmTmFtZSkgLT5cbiAgaWYgZmllbGROYW1lc1tmTmFtZV0/XG4gICAgcmV0dXJuIGZpZWxkTmFtZXNbZk5hbWVdXG5cbiAgcyA9IGZOYW1lLnJlcGxhY2UoL18vZyxcIiBcIilcbiAgcyA9IHMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzLnN1YnN0cmluZygxKVxuICByZXR1cm4gc1xuXG5cbnJlbmRlcl9maWVsZCA9IChmTmFtZSxkYXRhKS0+XG4gIGlmIFwiX1wiID09IHN1YnN0ciBmTmFtZSwgMCwgMVxuICAgIFwiXCJcIlxuICAgIDxkaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzPSdmLW5hbScgPiN7cmVuZGVyX2ZpZWxkX25hbWUgZk5hbWV9PC9zcGFuPlxuICAgICAgICA8c3BhbiBjbGFzcz0nZi12YWwnPiZuYnNwOzwvc3Bhbj5cbiAgICA8L2Rpdj5cbiAgICBcIlwiXCJcbiAgZWxzZVxuICAgIHJldHVybiAnJyB1bmxlc3MgZlZhbHVlID0gZGF0YVtmTmFtZV1cbiAgICBcIlwiXCJcbiAgICA8ZGl2PlxuICAgICAgICA8c3BhbiBjbGFzcz0nZi1uYW0nICA+I3tyZW5kZXJfZmllbGRfbmFtZSBmTmFtZX08ZGl2Pjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9J2YtdmFsJz4je3JlbmRlcl9maWVsZF92YWx1ZShmTmFtZSxkYXRhKX08L3NwYW4+XG4gICAgPC9kaXY+XG4gICAgXCJcIlwiXG5cbnJlbmRlcl9zdWJoZWFkaW5nID0gKGZOYW1lLCBtYXNrLCBub3RGaXJzdCktPlxuICBzID0gJydcbiAgZk5hbWUgPSByZW5kZXJfZmllbGRfbmFtZSBmTmFtZVxuICBpZiBtYXNrID09IFwiaGVhZGluZ1wiXG4gICAgaWYgbm90Rmlyc3QgIT0gMFxuICAgICAgcyArPSBcIjxici8+XCJcbiAgICBzICs9IFwiPGRpdj48c3BhbiBjbGFzcz0nZi1uYW0nPiN7Zk5hbWV9PC9zcGFuPjxzcGFuIGNsYXNzPSdmLXZhbCc+IDwvc3Bhbj48L2Rpdj5cIlxuICByZXR1cm4gc1xuXG5yZW5kZXJfZmllbGRzID0gKGZpZWxkcyxkYXRhLHRlbXBsYXRlKS0+XG4gIGggPSAnJ1xuICBmb3IgZmllbGQsaSBpbiBmaWVsZHNcbiAgICBpZiAodHlwZW9mIGZpZWxkIGlzIFwib2JqZWN0XCIpXG4gICAgICBpZiBmaWVsZC5tYXNrID09IFwiaGVhZGluZ1wiXG4gICAgICAgIGggKz0gcmVuZGVyX3N1YmhlYWRpbmcoZmllbGQubmFtZSwgZmllbGQubWFzaywgaSlcbiAgICAgICAgZlZhbHVlID0gJydcbiAgICAgIGVsc2VcbiAgICAgICAgZlZhbHVlID0gcmVuZGVyX2ZpZWxkX3ZhbHVlIGZpZWxkLm5hbWUsIGZpZWxkLm1hc2ssIGRhdGFcbiAgICAgICAgaWYgKCcnICE9IGZWYWx1ZSBhbmQgZlZhbHVlICE9ICcwJylcbiAgICAgICAgICBmTmFtZSA9IHJlbmRlcl9maWVsZF9uYW1lIGZpZWxkLm5hbWVcbiAgICAgICAgICBmTmFtZUhlbHAgPSByZW5kZXJfZmllbGRfbmFtZV9oZWxwIGZpZWxkLm5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGZWYWx1ZSA9ICcnXG5cbiAgICBlbHNlXG4gICAgICBmVmFsdWUgPSByZW5kZXJfZmllbGRfdmFsdWUgZmllbGQsICcnLCBkYXRhXG4gICAgICBpZiAoJycgIT0gZlZhbHVlKVxuICAgICAgICBmTmFtZSA9IHJlbmRlcl9maWVsZF9uYW1lIGZpZWxkXG4gICAgICAgIGZOYW1lSGVscCA9IHJlbmRlcl9maWVsZF9uYW1lX2hlbHAgZk5hbWVcbiAgICBpZiAoJycgIT0gZlZhbHVlKVxuICAgICAgaCArPSB0ZW1wbGF0ZShuYW1lOiBmTmFtZSwgdmFsdWU6IGZWYWx1ZSwgaGVscDogZk5hbWVIZWxwKVxuICByZXR1cm4gaFxuXG5yZW5kZXJfZmluYW5jaWFsX2ZpZWxkcyA9IChkYXRhLHRlbXBsYXRlKS0+XG4gIGggPSAnJ1xuICBtYXNrID0gJzAsMCdcbiAgY2F0ZWdvcnkgPSAnJ1xuICBpc19maXJzdF9yb3cgPSBmYWxzZVxuICBmb3IgZmllbGQgaW4gZGF0YVxuICAgIGlmIGNhdGVnb3J5ICE9IGZpZWxkLmNhdGVnb3J5X25hbWVcbiAgICAgIGNhdGVnb3J5ID0gZmllbGQuY2F0ZWdvcnlfbmFtZVxuICAgICAgaWYgY2F0ZWdvcnkgPT0gJ092ZXJ2aWV3J1xuICAgICAgICBoICs9IHRlbXBsYXRlKG5hbWU6IFwiPGI+XCIgKyBjYXRlZ29yeSArIFwiPC9iPlwiLCBnZW5mdW5kOiAnJywgb3RoZXJmdW5kczogJycsIHRvdGFsZnVuZHM6ICcnKVxuICAgICAgZWxzZSBpZiBjYXRlZ29yeSA9PSAnUmV2ZW51ZXMnXG4gICAgICAgIGggKz0gJzwvYnI+J1xuICAgICAgICBoICs9IFwiPGI+XCIgKyB0ZW1wbGF0ZShuYW1lOiBjYXRlZ29yeSwgZ2VuZnVuZDogXCJHZW5lcmFsIEZ1bmRcIiwgb3RoZXJmdW5kczogXCJPdGhlciBGdW5kc1wiLCB0b3RhbGZ1bmRzOiBcIlRvdGFsIEdvdi4gRnVuZHNcIikgKyBcIjwvYj5cIlxuICAgICAgICBpc19maXJzdF9yb3cgPSB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgIGggKz0gJzwvYnI+J1xuICAgICAgICBoICs9IHRlbXBsYXRlKG5hbWU6IFwiPGI+XCIgKyBjYXRlZ29yeSArIFwiPC9iPlwiLCBnZW5mdW5kOiAnJywgb3RoZXJmdW5kczogJycsIHRvdGFsZnVuZHM6ICcnKVxuICAgICAgICBpc19maXJzdF9yb3cgPSB0cnVlXG5cbiAgICBpZiBmaWVsZC5jYXB0aW9uID09ICdHZW5lcmFsIEZ1bmQgQmFsYW5jZScgb3IgZmllbGQuY2FwdGlvbiA9PSAnTG9uZyBUZXJtIERlYnQnXG4gICAgICBoICs9IHRlbXBsYXRlKG5hbWU6IGZpZWxkLmNhcHRpb24sIGdlbmZ1bmQ6IGN1cnJlbmN5KGZpZWxkLmdlbmZ1bmQsIG1hc2ssICc8c3BhbiBjbGFzcz1cImN1cnJlbmN5LXNpZ25cIj4kPC9zcGFuPicpKVxuICAgIGVsc2UgaWYgZmllbGQuY2FwdGlvbiBpbiBbJ1RvdGFsIFJldmVudWVzJywgJ1RvdGFsIEV4cGVuZGl0dXJlcycsICdTdXJwbHVzIC8gKERlZmljaXQpJ10gb3IgaXNfZmlyc3Rfcm93XG4gICAgICBoICs9IHRlbXBsYXRlKG5hbWU6IGZpZWxkLmNhcHRpb24sIGdlbmZ1bmQ6IGN1cnJlbmN5KGZpZWxkLmdlbmZ1bmQsIG1hc2ssICc8c3BhbiBjbGFzcz1cImN1cnJlbmN5LXNpZ25cIj4kPC9zcGFuPicpLCBvdGhlcmZ1bmRzOiBjdXJyZW5jeShmaWVsZC5vdGhlcmZ1bmRzLCBtYXNrLCAnPHNwYW4gY2xhc3M9XCJjdXJyZW5jeS1zaWduXCI+JDwvc3Bhbj4nKSwgdG90YWxmdW5kczogY3VycmVuY3koZmllbGQudG90YWxmdW5kcywgbWFzaywgJzxzcGFuIGNsYXNzPVwiY3VycmVuY3ktc2lnblwiPiQ8L3NwYW4+JykpXG4gICAgICBpc19maXJzdF9yb3cgPSBmYWxzZVxuICAgIGVsc2VcbiAgICAgIGggKz0gdGVtcGxhdGUobmFtZTogZmllbGQuY2FwdGlvbiwgZ2VuZnVuZDogY3VycmVuY3koZmllbGQuZ2VuZnVuZCwgbWFzayksIG90aGVyZnVuZHM6IGN1cnJlbmN5KGZpZWxkLm90aGVyZnVuZHMsIG1hc2spLCB0b3RhbGZ1bmRzOiBjdXJyZW5jeShmaWVsZC50b3RhbGZ1bmRzLCBtYXNrKSlcbiAgcmV0dXJuIGhcblxudW5kZXIgPSAocykgLT4gcy5yZXBsYWNlKC9bXFxzXFwrXFwtXS9nLCAnXycpXG5cbnRvVGl0bGVDYXNlID0gKHN0cikgLT5cbiAgc3RyLnJlcGxhY2UgL1xcd1xcUyovZywgKHR4dCkgLT5cbiAgICB0eHQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0eHQuc3Vic3RyKDEpLnRvTG93ZXJDYXNlKClcblxuY3VycmVuY3kgPSAobiwgbWFzaywgc2lnbiA9ICcnKSAtPlxuICAgIG4gPSBudW1lcmFsKG4pXG4gICAgaWYgbiA8IDBcbiAgICAgICAgcyA9IG4uZm9ybWF0KG1hc2spLnRvU3RyaW5nKClcbiAgICAgICAgcyA9IHMucmVwbGFjZSgvLS9nLCAnJylcbiAgICAgICAgcmV0dXJuIFwiKCN7c2lnbn0jeyc8c3BhbiBjbGFzcz1cImZpbi12YWxcIj4nK3MrJzwvc3Bhbj4nfSlcIlxuXG4gICAgbiA9IG4uZm9ybWF0KG1hc2spXG4gICAgcmV0dXJuIFwiI3tzaWdufSN7JzxzcGFuIGNsYXNzPVwiZmluLXZhbFwiPicrbisnPC9zcGFuPid9XCJcblxucmVuZGVyX3RhYnMgPSAoaW5pdGlhbF9sYXlvdXQsIGRhdGEsIHRhYnNldCwgcGFyZW50KSAtPlxuICAjbGF5b3V0ID0gYWRkX290aGVyX3RhYl90b19sYXlvdXQgaW5pdGlhbF9sYXlvdXQsIGRhdGFcbiAgbGF5b3V0ID0gaW5pdGlhbF9sYXlvdXRcbiAgdGVtcGxhdGVzID0gcGFyZW50LnRlbXBsYXRlc1xuICBwbG90X2hhbmRsZXMgPSB7fVxuXG4gIGxheW91dF9kYXRhID1cbiAgICB0aXRsZTogZGF0YS5nb3ZfbmFtZVxuICAgIHdpa2lwZWRpYV9wYWdlX2V4aXN0czogZGF0YS53aWtpcGVkaWFfcGFnZV9leGlzdHNcbiAgICB3aWtpcGVkaWFfcGFnZV9uYW1lOiAgZGF0YS53aWtpcGVkaWFfcGFnZV9uYW1lXG4gICAgdHJhbnNwYXJlbnRfY2FsaWZvcm5pYV9wYWdlX25hbWU6IGRhdGEudHJhbnNwYXJlbnRfY2FsaWZvcm5pYV9wYWdlX25hbWVcbiAgICBsYXRlc3RfYXVkaXRfdXJsOiBkYXRhLmxhdGVzdF9hdWRpdF91cmxcbiAgICB0YWJzOiBbXVxuICAgIHRhYmNvbnRlbnQ6ICcnXG5cbiAgZm9yIHRhYixpIGluIGxheW91dFxuICAgIGxheW91dF9kYXRhLnRhYnMucHVzaFxuICAgICAgdGFiaWQ6IHVuZGVyKHRhYi5uYW1lKSxcbiAgICAgIHRhYm5hbWU6IHRhYi5uYW1lLFxuICAgICAgYWN0aXZlOiAoaWYgaT4wIHRoZW4gJycgZWxzZSAnYWN0aXZlJylcblxuICBmb3IgdGFiLGkgaW4gbGF5b3V0XG4gICAgZGV0YWlsX2RhdGEgPVxuICAgICAgdGFiaWQ6IHVuZGVyKHRhYi5uYW1lKSxcbiAgICAgIHRhYm5hbWU6IHRhYi5uYW1lLFxuICAgICAgYWN0aXZlOiAoaWYgaT4wIHRoZW4gJycgZWxzZSAnYWN0aXZlJylcbiAgICAgIHRhYmNvbnRlbnQ6ICcnXG4gICAgc3dpdGNoIHRhYi5uYW1lXG4gICAgICB3aGVuICdPdmVydmlldyArIEVsZWN0ZWQgT2ZmaWNpYWxzJ1xuICAgICAgICBkZXRhaWxfZGF0YS50YWJjb250ZW50ICs9IHJlbmRlcl9maWVsZHMgdGFiLmZpZWxkcywgZGF0YSwgdGVtcGxhdGVzWyd0YWJkZXRhaWwtbmFtZXZhbHVlLXRlbXBsYXRlJ11cbiAgICAgICAgY29uc29sZS5sb2coZGF0YS5lbGVjdGVkX29mZmljaWFscy5yZWNvcmQpXG4gICAgICAgIGZvciBvZmZpY2lhbCxpIGluIGRhdGEuZWxlY3RlZF9vZmZpY2lhbHMucmVjb3JkXG4gICAgICAgICAgb2ZmaWNpYWxfZGF0YSA9XG4gICAgICAgICAgICB0aXRsZTogaWYgJycgIT0gb2ZmaWNpYWwudGl0bGUgdGhlbiBcIlRpdGxlOiBcIiArIG9mZmljaWFsLnRpdGxlXG4gICAgICAgICAgICBuYW1lOiBpZiAnJyAhPSBvZmZpY2lhbC5mdWxsX25hbWUgdGhlbiBcIk5hbWU6IFwiICsgb2ZmaWNpYWwuZnVsbF9uYW1lXG4gICAgICAgICAgICBlbWFpbDogaWYgbnVsbCAhPSBvZmZpY2lhbC5lbWFpbF9hZGRyZXNzIHRoZW4gXCJFbWFpbDogXCIgKyBvZmZpY2lhbC5lbWFpbF9hZGRyZXNzXG4gICAgICAgICAgICB0ZWxlcGhvbmVudW1iZXI6IGlmIG51bGwgIT0gb2ZmaWNpYWwudGVsZXBob25lX251bWJlciBhbmQgdW5kZWZpbmVkICE9IG9mZmljaWFsLnRlbGVwaG9uZV9udW1iZXIgdGhlbiBcIlRlbGVwaG9uZSBOdW1iZXI6IFwiICsgb2ZmaWNpYWwudGVsZXBob25lX251bWJlclxuICAgICAgICAgICAgdGVybWV4cGlyZXM6IGlmIG51bGwgIT0gb2ZmaWNpYWwudGVybV9leHBpcmVzIHRoZW4gXCJUZXJtIEV4cGlyZXM6IFwiICsgb2ZmaWNpYWwudGVybV9leHBpcmVzXG4gICAgICAgICAgICBnb3ZzX2lkOiBvZmZpY2lhbC5nb3ZzX2lkXG4gICAgICAgICAgICBlbGVjdGVkX29mZmljaWFsX2lkOiBvZmZpY2lhbC5lbGVjdGVkX29mZmljaWFsX2lkXG5cbiAgICAgICAgICBpZiAnJyAhPSBvZmZpY2lhbC5waG90b191cmwgYW5kIG9mZmljaWFsLnBob3RvX3VybCAhPSBudWxsIHRoZW4gb2ZmaWNpYWxfZGF0YS5pbWFnZSA9ICAnPGltZyBzcmM9XCInK29mZmljaWFsLnBob3RvX3VybCsnXCIgY2xhc3M9XCJwb3J0cmFpdFwiIGFsdD1cIlwiIC8+J1xuICAgICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gdGVtcGxhdGVzWyd0YWJkZXRhaWwtb2ZmaWNpYWwtdGVtcGxhdGUnXShvZmZpY2lhbF9kYXRhKVxuICAgICAgd2hlbiAnRW1wbG95ZWUgQ29tcGVuc2F0aW9uJ1xuICAgICAgICBoID0gJydcbiAgICAgICAgaCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXG4gICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gdGVtcGxhdGVzWyd0YWJkZXRhaWwtZW1wbG95ZWUtY29tcC10ZW1wbGF0ZSddKGNvbnRlbnQ6IGgpXG4gICAgICAgIGlmIG5vdCBwbG90X2hhbmRsZXNbJ21lZGlhbi1jb21wLWdyYXBoJ11cbiAgICAgICAgICBncmFwaCA9IHRydWVcbiAgICAgICAgICBpZiBkYXRhWydtZWRpYW5fc2FsYXJ5X3Blcl9mdWxsX3RpbWVfZW1wJ10gPT0gMFxuICAgICAgICAgICAgZ3JhcGggPSBmYWxzZVxuICAgICAgICAgIGlmIGRhdGFbJ21lZGlhbl9iZW5lZml0c19wZXJfZnRfZW1wJ10gPT0gMFxuICAgICAgICAgICAgZ3JhcGggPSBmYWxzZVxuICAgICAgICAgIGlmIGRhdGFbJ21lZGlhbl93YWdlc19nZW5lcmFsX3B1YmxpYyddID09IDBcbiAgICAgICAgICAgIGdyYXBoID0gZmFsc2VcbiAgICAgICAgICBpZiBkYXRhWydtZWRpYW5fYmVuZWZpdHNfZ2VuZXJhbF9wdWJsaWMnXSA9PSAwXG4gICAgICAgICAgICBncmFwaCA9IGZhbHNlXG4gICAgICAgICAgc21hbGxDaGFydFdpZHRoID0gMzQwXG4gICAgICAgICAgYmlnQ2hhcnRXaWR0aCA9IDQ3MFxuXG4gICAgICAgICAgaWYgJCh3aW5kb3cpLndpZHRoKCkgPCA0OTBcbiAgICAgICAgICAgIHNtYWxsQ2hhcnRXaWR0aCA9IDMwMFxuICAgICAgICAgICAgYmlnQ2hhcnRXaWR0aCA9IDMwMFxuICAgICAgICAgIGRyYXdDaGFydCA9ICgpIC0+XG4gICAgICAgICAgICBzZXRUaW1lb3V0ICggLT5cbiAgICAgICAgICAgICAgdmlzX2RhdGEgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uRGF0YVRhYmxlKClcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdzdHJpbmcnLCAnTWVkaWFuIENvbXBlbnNhdGlvbidcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnV2FnZXMnXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnbnVtYmVyJywgJ0JlbnMuJ1xuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRSb3dzIFtcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICB0b1RpdGxlQ2FzZSBkYXRhLmdvdl9uYW1lICsgJ1xcbiBFbXBsb3llZXMnXG4gICAgICAgICAgICAgICAgICBkYXRhWydtZWRpYW5fc2FsYXJ5X3Blcl9mdWxsX3RpbWVfZW1wJ11cbiAgICAgICAgICAgICAgICAgIGRhdGFbJ21lZGlhbl9iZW5lZml0c19wZXJfZnRfZW1wJ11cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgJ0FsbCBcXG4nICsgdG9UaXRsZUNhc2UgZGF0YS5nb3ZfbmFtZSArICcgXFxuIFJlc2lkZW50cydcbiAgICAgICAgICAgICAgICAgIGRhdGFbJ21lZGlhbl93YWdlc19nZW5lcmFsX3B1YmxpYyddXG4gICAgICAgICAgICAgICAgICBkYXRhWydtZWRpYW5fYmVuZWZpdHNfZ2VuZXJhbF9wdWJsaWMnXVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICBmb3JtYXR0ZXIgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uTnVtYmVyRm9ybWF0KGdyb3VwaW5nU3ltYm9sOiAnLCcgLCBmcmFjdGlvbkRpZ2l0czogJzAnKVxuICAgICAgICAgICAgICBmb3JtYXR0ZXIuZm9ybWF0KHZpc19kYXRhLCAxKTtcbiAgICAgICAgICAgICAgZm9ybWF0dGVyLmZvcm1hdCh2aXNfZGF0YSwgMik7XG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxuICAgICAgICAgICAgICAgICd0aXRsZSc6J01lZGlhbiBUb3RhbCBDb21wZW5zYXRpb24gLSBGdWxsIFRpbWUgV29ya2VyczogXFxuIEdvdmVybm1lbnQgdnMuIFByaXZhdGUgU2VjdG9yJ1xuICAgICAgICAgICAgICAgICd0aXRsZVRleHRTdHlsZSc6XG4gICAgICAgICAgICAgICAgICdmb250U2l6ZSc6IDEyXG4gICAgICAgICAgICAgICAgJ3Rvb2x0aXAnOlxuICAgICAgICAgICAgICAgICAndGV4dFN0eWxlJzpcbiAgICAgICAgICAgICAgICAgICdmb250U2l6ZSc6IDEyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogc21hbGxDaGFydFdpZHRoXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IDMwMFxuICAgICAgICAgICAgICAgICdpc1N0YWNrZWQnOiAndHJ1ZSdcbiAgICAgICAgICAgICAgICAnY29sb3JzJzogWycjMDA1Y2U2JywgJyMwMDk5MzMnXVxuICAgICAgICAgICAgICBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5Db2x1bW5DaGFydCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAnbWVkaWFuLWNvbXAtZ3JhcGgnXG4gICAgICAgICAgICAgIGNoYXJ0LmRyYXcgdmlzX2RhdGEsIG9wdGlvbnNcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICApLCAxMDAwXG4gICAgICAgICAgaWYgZ3JhcGhcbiAgICAgICAgICAgIGdvb2dsZS5sb2FkICd2aXN1YWxpemF0aW9uJywgJzEuMCcsXG4gICAgICAgICAgICAnY2FsbGJhY2snIDogZHJhd0NoYXJ0KClcbiAgICAgICAgICAgICdwYWNrYWdlcycgOidjb3JlY2hhcnQnXG4gICAgICAgICAgcGxvdF9oYW5kbGVzWydtZWRpYW4tY29tcC1ncmFwaCddID0nbWVkaWFuLWNvbXAtZ3JhcGgnXG4gICAgICAgIGlmIG5vdCBwbG90X2hhbmRsZXNbJ21lZGlhbi1wZW5zaW9uLWdyYXBoJ11cbiAgICAgICAgICBncmFwaCA9IHRydWVcbiAgICAgICAgICBpZiBkYXRhWydtZWRpYW5fcGVuc2lvbl8zMF95ZWFyX3JldGlyZWUnXSA9PSAwXG4gICAgICAgICAgICBncmFwaCA9IGZhbHNlXG4gICAgICAgICAgZHJhd0NoYXJ0ID0gKCkgLT5cbiAgICAgICAgICAgIHNldFRpbWVvdXQgKCAtPlxuICAgICAgICAgICAgICB2aXNfZGF0YSA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5EYXRhVGFibGUoKVxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ3N0cmluZycsICdNZWRpYW4gUGVuc2lvbidcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnV2FnZXMnXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZFJvd3MgW1xuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICdQZW5zaW9uIGZvciBcXG4gUmV0aXJlZSB3LyAzMCBZZWFycydcbiAgICAgICAgICAgICAgICAgIGRhdGFbJ21lZGlhbl9wZW5zaW9uXzMwX3llYXJfcmV0aXJlZSddXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIGZvcm1hdHRlciA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5OdW1iZXJGb3JtYXQoZ3JvdXBpbmdTeW1ib2w6ICcsJyAsIGZyYWN0aW9uRGlnaXRzOiAnMCcpXG4gICAgICAgICAgICAgIGZvcm1hdHRlci5mb3JtYXQodmlzX2RhdGEsIDEpO1xuICAgICAgICAgICAgICBvcHRpb25zID1cbiAgICAgICAgICAgICAgICAndGl0bGUnOidNZWRpYW4gVG90YWwgUGVuc2lvbidcbiAgICAgICAgICAgICAgICAndGl0bGVUZXh0U3R5bGUnOlxuICAgICAgICAgICAgICAgICAnZm9udFNpemUnOiAxMlxuICAgICAgICAgICAgICAgICd0b29sdGlwJzpcbiAgICAgICAgICAgICAgICAgJ3RleHRTdHlsZSc6XG4gICAgICAgICAgICAgICAgICAnZm9udFNpemUnOiAxMlxuICAgICAgICAgICAgICAgICd3aWR0aCc6IHNtYWxsQ2hhcnRXaWR0aFxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAzMDBcbiAgICAgICAgICAgICAgICAnYmFyJzoge1xuICAgICAgICAgICAgICAgICAnZ3JvdXBXaWR0aCc6ICczMCUnXG4gICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAnaXNTdGFja2VkJzogJ3RydWUnXG4gICAgICAgICAgICAgICAgJ2NvbG9ycyc6IFsnIzAwNWNlNicsICcjMDA5OTMzJ11cbiAgICAgICAgICAgICAgaWYgZ3JhcGhcbiAgICAgICAgICAgICAgICBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5Db2x1bW5DaGFydCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAnbWVkaWFuLXBlbnNpb24tZ3JhcGgnXG4gICAgICAgICAgICAgICAgY2hhcnQuZHJhdyB2aXNfZGF0YSwgb3B0aW9uc1xuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICksIDEwMDBcbiAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxuICAgICAgICAgICdjYWxsYmFjaycgOiBkcmF3Q2hhcnQoKVxuICAgICAgICAgICdwYWNrYWdlcycgOidjb3JlY2hhcnQnXG4gICAgICAgICAgcGxvdF9oYW5kbGVzWydtZWRpYW4tcGVuc2lvbi1ncmFwaCddID0nbWVkaWFuLXBlbnNpb24tZ3JhcGgnXG4gICAgICB3aGVuICdGaW5hbmNpYWwgSGVhbHRoJ1xuICAgICAgICBoID0gJydcbiAgICAgICAgaCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXG4gICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gdGVtcGxhdGVzWyd0YWJkZXRhaWwtZmluYW5jaWFsLWhlYWx0aC10ZW1wbGF0ZSddKGNvbnRlbnQ6IGgpXG4gICAgICAgICNwdWJsaWMgc2FmZXR5IHBpZVxuICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWydwdWJsaWMtc2FmZXR5LXBpZSddIGFuZCBkYXRhWydhbHRfdHlwZSddICE9ICdTY2hvb2wgRGlzdHJpY3QnXG4gICAgICAgICAgZ3JhcGggPSB0cnVlXG4gICAgICAgICAgaWYgZGF0YVsncHVibGljX3NhZmV0eV9leHBfb3Zlcl90b3RfZ292X2Z1bmRfcmV2ZW51ZSddID09IDBcbiAgICAgICAgICAgIGdyYXBoID0gZmFsc2VcbiAgICAgICAgICBkcmF3Q2hhcnQgPSAoKSAtPlxuICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+XG4gICAgICAgICAgICAgIHZpc19kYXRhID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkRhdGFUYWJsZSgpXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnc3RyaW5nJywgJ1B1YmxpYyBTYWZldHkgRXhwZW5zZSdcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnVG90YWwnXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZFJvd3MgW1xuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICdQdWJsaWMgU2FmZXR5IEV4cCdcbiAgICAgICAgICAgICAgICAgIDEgLSBkYXRhWydwdWJsaWNfc2FmZXR5X2V4cF9vdmVyX3RvdF9nb3ZfZnVuZF9yZXZlbnVlJ11cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgJ090aGVyJ1xuICAgICAgICAgICAgICAgICAgZGF0YVsncHVibGljX3NhZmV0eV9leHBfb3Zlcl90b3RfZ292X2Z1bmRfcmV2ZW51ZSddXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxuICAgICAgICAgICAgICAgICd0aXRsZSc6J1B1YmxpYyBzYWZldHkgZXhwZW5zZSdcbiAgICAgICAgICAgICAgICAndGl0bGVUZXh0U3R5bGUnOlxuICAgICAgICAgICAgICAgICAnZm9udFNpemUnOiAxMlxuICAgICAgICAgICAgICAgICd0b29sdGlwJzpcbiAgICAgICAgICAgICAgICAgJ3RleHRTdHlsZSc6XG4gICAgICAgICAgICAgICAgICAnZm9udFNpemUnOiAxMlxuICAgICAgICAgICAgICAgICd3aWR0aCc6IHNtYWxsQ2hhcnRXaWR0aFxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAzMDBcbiAgICAgICAgICAgICAgICAnaXMzRCcgOiAndHJ1ZSdcbiAgICAgICAgICAgICAgICAnY29sb3JzJzogWycjMDA1Y2U2JywgJyMwMDk5MzMnXVxuICAgICAgICAgICAgICAgICdzbGljZXMnOiB7IDE6IHtvZmZzZXQ6IDAuMn19XG4gICAgICAgICAgICAgICAgJ3BpZVN0YXJ0QW5nbGUnOiA0NVxuICAgICAgICAgICAgICBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5QaWVDaGFydCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAncHVibGljLXNhZmV0eS1waWUnXG4gICAgICAgICAgICAgIGNoYXJ0LmRyYXcgdmlzX2RhdGEsIG9wdGlvbnNcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICApLCAxMDAwXG4gICAgICAgICAgaWYgZ3JhcGhcbiAgICAgICAgICAgIGdvb2dsZS5sb2FkICd2aXN1YWxpemF0aW9uJywgJzEuMCcsXG4gICAgICAgICAgICAnY2FsbGJhY2snIDogZHJhd0NoYXJ0KClcbiAgICAgICAgICAgICdwYWNrYWdlcycgOidjb3JlY2hhcnQnXG4gICAgICAgICAgcGxvdF9oYW5kbGVzWydwdWJsaWMtc2FmZXR5LXBpZSddID0ncHVibGljLXNhZmV0eS1waWUnXG4gICAgICAgICNmaW4taGVhbHRoLXJldmVudWUgZ3JhcGhcbiAgICAgICAgaWYgbm90IHBsb3RfaGFuZGxlc1snZmluLWhlYWx0aC1yZXZlbnVlLWdyYXBoJ10gYW5kIGRhdGFbJ2FsdF90eXBlJ10gIT0gJ1NjaG9vbCBEaXN0cmljdCdcbiAgICAgICAgICBncmFwaCA9IHRydWVcbiAgICAgICAgICAjY29uc29sZS5sb2cgJyMjI2FsJytKU09OLnN0cmluZ2lmeSBkYXRhXG4gICAgICAgICAgaWYgZGF0YVsndG90YWxfcmV2ZW51ZV9wZXJfY2FwaXRhJ10gPT0gMFxuICAgICAgICAgICAgZ3JhcGggPSBmYWxzZVxuICAgICAgICAgIGRyYXdDaGFydCA9ICgpIC0+XG4gICAgICAgICAgICBzZXRUaW1lb3V0ICggLT5cbiAgICAgICAgICAgICAgdmlzX2RhdGEgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uRGF0YVRhYmxlKClcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdzdHJpbmcnLCAnUGVyIENhcGl0YSdcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnUmV2LidcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkUm93cyBbXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgJ1RvdGFsIFJldmVudWUgXFxuIFBlciBDYXBpdGEnXG4gICAgICAgICAgICAgICAgICBkYXRhWyd0b3RhbF9yZXZlbnVlX3Blcl9jYXBpdGEnXVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAnTWVkaWFuIFRvdGFsIFxcbiBSZXZlbnVlIFBlciBcXG4gQ2FwaXRhIEZvciBBbGwgQ2l0aWVzJ1xuICAgICAgICAgICAgICAgICAgNDIwXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxuICAgICAgICAgICAgICAgICd0aXRsZSc6J1RvdGFsIFJldmVudWUnXG4gICAgICAgICAgICAgICAgJ3RpdGxlVGV4dFN0eWxlJzpcbiAgICAgICAgICAgICAgICAgJ2ZvbnRTaXplJzogMTJcbiAgICAgICAgICAgICAgICAndG9vbHRpcCc6XG4gICAgICAgICAgICAgICAgICd0ZXh0U3R5bGUnOlxuICAgICAgICAgICAgICAgICAgJ2ZvbnRTaXplJzogMTJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiBzbWFsbENoYXJ0V2lkdGhcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogMzAwXG4gICAgICAgICAgICAgICAgJ2lzU3RhY2tlZCc6ICd0cnVlJ1xuICAgICAgICAgICAgICAgICdjb2xvcnMnOiBbJyMwMDVjZTYnLCAnIzAwOTkzMyddXG4gICAgICAgICAgICAgICAgJ2NoYXJ0QXJlYS53aWR0aCc6ICcxMDAlJ1xuICAgICAgICAgICAgICBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5Db2x1bW5DaGFydCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAnZmluLWhlYWx0aC1yZXZlbnVlLWdyYXBoJ1xuICAgICAgICAgICAgICBjaGFydC5kcmF3IHZpc19kYXRhLCBvcHRpb25zXG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgKSwgMTAwMFxuICAgICAgICAgIGlmIGdyYXBoXG4gICAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxuICAgICAgICAgICAgJ2NhbGxiYWNrJyA6IGRyYXdDaGFydCgpXG4gICAgICAgICAgICAncGFja2FnZXMnIDonY29yZWNoYXJ0J1xuICAgICAgICAgIHBsb3RfaGFuZGxlc1snZmluLWhlYWx0aC1yZXZlbnVlLWdyYXBoJ10gPSdmaW4taGVhbHRoLXJldmVudWUtZ3JhcGgnXG4gICAgICAgICNmaW4taGVhbHRoLWV4cGVuZGl0dXJlcy1ncmFwaFxuICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWydmaW4taGVhbHRoLWV4cGVuZGl0dXJlcy1ncmFwaCddIGFuZCBkYXRhWydhbHRfdHlwZSddICE9ICdTY2hvb2wgRGlzdHJpY3QnXG4gICAgICAgICAgZ3JhcGggPSB0cnVlXG4gICAgICAgICAgaWYgZGF0YVsndG90YWxfZXhwZW5kaXR1cmVzX3Blcl9jYXBpdGEnXSA9PSAwXG4gICAgICAgICAgICBncmFwaCA9IGZhbHNlXG4gICAgICAgICAgZHJhd0NoYXJ0ID0gKCkgLT5cbiAgICAgICAgICAgIHNldFRpbWVvdXQgKCAtPlxuICAgICAgICAgICAgICB2aXNfZGF0YSA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5EYXRhVGFibGUoKVxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ3N0cmluZycsICdQZXIgQ2FwaXRhJ1xuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ251bWJlcicsICdFeHAuJ1xuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRSb3dzIFtcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAnVG90YWwgRXhwZW5kaXR1cmVzIFxcbiBQZXIgQ2FwaXRhJ1xuICAgICAgICAgICAgICAgICAgZGF0YVsndG90YWxfZXhwZW5kaXR1cmVzX3Blcl9jYXBpdGEnXVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAnTWVkaWFuIFRvdGFsIFxcbiBFeHBlbmRpdHVyZXMgXFxuIFBlciBDYXBpdGEgXFxuIEZvciBBbGwgQ2l0aWVzJ1xuICAgICAgICAgICAgICAgICAgNDIwXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxuICAgICAgICAgICAgICAgICd0aXRsZSc6J1RvdGFsIEV4cGVuZGl0dXJlcydcbiAgICAgICAgICAgICAgICAndGl0bGVUZXh0U3R5bGUnOlxuICAgICAgICAgICAgICAgICAnZm9udFNpemUnOiAxMlxuICAgICAgICAgICAgICAgICd0b29sdGlwJzpcbiAgICAgICAgICAgICAgICAgJ3RleHRTdHlsZSc6XG4gICAgICAgICAgICAgICAgICAnZm9udFNpemUnOiAxMlxuICAgICAgICAgICAgICAgICd3aWR0aCc6IHNtYWxsQ2hhcnRXaWR0aFxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAzMDBcbiAgICAgICAgICAgICAgICAnaXNTdGFja2VkJzogJ3RydWUnXG4gICAgICAgICAgICAgICAgJ2NvbG9ycyc6IFsnIzAwNWNlNicsICcjMDA5OTMzJ11cbiAgICAgICAgICAgICAgICAnY2hhcnRBcmVhLndpZHRoJzogJzEwMCUnXG4gICAgICAgICAgICAgIGlmIGdyYXBoXG4gICAgICAgICAgICAgICAgY2hhcnQgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uQ29sdW1uQ2hhcnQgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ2Zpbi1oZWFsdGgtZXhwZW5kaXR1cmVzLWdyYXBoJ1xuICAgICAgICAgICAgICAgIGNoYXJ0LmRyYXcgdmlzX2RhdGEsIG9wdGlvbnNcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICApLCAxMDAwXG4gICAgICAgICAgZ29vZ2xlLmxvYWQgJ3Zpc3VhbGl6YXRpb24nLCAnMS4wJyxcbiAgICAgICAgICAnY2FsbGJhY2snIDogZHJhd0NoYXJ0KClcbiAgICAgICAgICAncGFja2FnZXMnIDonY29yZWNoYXJ0J1xuICAgICAgICAgIHBsb3RfaGFuZGxlc1snZmluLWhlYWx0aC1leHBlbmRpdHVyZXMtZ3JhcGgnXSA9J2Zpbi1oZWFsdGgtZXhwZW5kaXR1cmVzLWdyYXBoJ1xuICAgICAgd2hlbiAnRmluYW5jaWFsIFN0YXRlbWVudHMnXG4gICAgICAgIGlmIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHNcbiAgICAgICAgICBoID0gJydcbiAgICAgICAgICAjaCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXG4gICAgICAgICAgaCArPSByZW5kZXJfZmluYW5jaWFsX2ZpZWxkcyBkYXRhLmZpbmFuY2lhbF9zdGF0ZW1lbnRzLCB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1maW5zdGF0ZW1lbnQtdGVtcGxhdGUnXVxuICAgICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gdGVtcGxhdGVzWyd0YWJkZXRhaWwtZmluYW5jaWFsLXN0YXRlbWVudHMtdGVtcGxhdGUnXShjb250ZW50OiBoKVxuICAgICAgICAgICN0YWJkZXRhaWwtZmluYW5jaWFsLXN0YXRlbWVudHMtdGVtcGxhdGVcbiAgICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWyd0b3RhbC1yZXZlbnVlLXBpZSddXG4gICAgICAgICAgICBncmFwaCA9IHRydWVcbiAgICAgICAgICAgIGlmIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHMubGVuZ3RoID09IDBcbiAgICAgICAgICAgICAgZ3JhcGggPSBmYWxzZVxuICAgICAgICAgICAgZHJhd0NoYXJ0ID0gKCkgLT5cbiAgICAgICAgICAgIHNldFRpbWVvdXQgKCAtPlxuICAgICAgICAgICAgICB2aXNfZGF0YSA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5EYXRhVGFibGUoKVxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ3N0cmluZycsICdUb3RhbCBHb3YuIEV4cGVuZGl0dXJlcydcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnVG90YWwnXG5cbiAgICAgICAgICAgICAgcm93cyA9IFtdXG4gICAgICAgICAgICAgIGZvciBpdGVtIGluIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHNcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyAnQEBAQCcrSlNPTi5zdHJpbmdpZnkgaXRlbVxuICAgICAgICAgICAgICAgIGlmIChpdGVtLmNhdGVnb3J5X25hbWUgaXMgXCJSZXZlbnVlc1wiKSBhbmQgKGl0ZW0uY2FwdGlvbiBpc250IFwiVG90YWwgUmV2ZW51ZXNcIilcblxuICAgICAgICAgICAgICAgICAgciA9IFtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jYXB0aW9uXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlSW50IGl0ZW0udG90YWxmdW5kc1xuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgcm93cy5wdXNoKHIpXG5cbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkUm93cyByb3dzXG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxuICAgICAgICAgICAgICAgICd0aXRsZSc6J1RvdGFsIFJldmVudWVzJ1xuICAgICAgICAgICAgICAgICd0aXRsZVRleHRTdHlsZSc6XG4gICAgICAgICAgICAgICAgICdmb250U2l6ZSc6IDE2XG4gICAgICAgICAgICAgICAgJ3Rvb2x0aXAnOlxuICAgICAgICAgICAgICAgICAndGV4dFN0eWxlJzpcbiAgICAgICAgICAgICAgICAgICdmb250U2l6ZSc6IDEyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogYmlnQ2hhcnRXaWR0aFxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAzNTBcbiAgICAgICAgICAgICAgICAncGllU3RhcnRBbmdsZSc6IDYwXG4gICAgICAgICAgICAgICAgJ3NsaWNlVmlzaWJpbGl0eVRocmVzaG9sZCc6IC4wNVxuICAgICAgICAgICAgICAgICdmb3JjZUlGcmFtZSc6IHRydWVcbiAgICAgICAgICAgICAgICAnY2hhcnRBcmVhJzp7XG4gICAgICAgICAgICAgICAgICAgd2lkdGg6JzkwJSdcbiAgICAgICAgICAgICAgICAgICBoZWlnaHQ6Jzc1JSdcbiAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICMnaXMzRCcgOiAndHJ1ZSdcbiAgICAgICAgICAgICAgaWYgZ3JhcGhcbiAgICAgICAgICAgICAgICBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5QaWVDaGFydCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAndG90YWwtcmV2ZW51ZS1waWUnXG4gICAgICAgICAgICAgICAgY2hhcnQuZHJhdyB2aXNfZGF0YSwgb3B0aW9uc1xuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICksIDEwMDBcbiAgICAgICAgICBpZiBncmFwaFxuICAgICAgICAgICAgZ29vZ2xlLmxvYWQgJ3Zpc3VhbGl6YXRpb24nLCAnMS4wJyxcbiAgICAgICAgICAgICdjYWxsYmFjaycgOiBkcmF3Q2hhcnQoKVxuICAgICAgICAgICAgJ3BhY2thZ2VzJyA6J2NvcmVjaGFydCdcbiAgICAgICAgICBwbG90X2hhbmRsZXNbJ3RvdGFsLXJldmVudWUtcGllJ10gPSd0b3RhbC1yZXZlbnVlLXBpZSdcbiAgICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWyd0b3RhbC1leHBlbmRpdHVyZXMtcGllJ11cbiAgICAgICAgICAgIGdyYXBoID0gdHJ1ZVxuICAgICAgICAgICAgaWYgZGF0YS5maW5hbmNpYWxfc3RhdGVtZW50cy5sZW5ndGggPT0gMFxuICAgICAgICAgICAgICBncmFwaCA9IGZhbHNlXG4gICAgICAgICAgICBkcmF3Q2hhcnQgPSAoKSAtPlxuICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+XG4gICAgICAgICAgICAgIHZpc19kYXRhID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkRhdGFUYWJsZSgpXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnc3RyaW5nJywgJ1RvdGFsIEdvdi4gRXhwZW5kaXR1cmVzJ1xuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ251bWJlcicsICdUb3RhbCdcblxuICAgICAgICAgICAgICByb3dzID0gW11cbiAgICAgICAgICAgICAgZm9yIGl0ZW0gaW4gZGF0YS5maW5hbmNpYWxfc3RhdGVtZW50c1xuICAgICAgICAgICAgICAgIGlmIChpdGVtLmNhdGVnb3J5X25hbWUgaXMgXCJFeHBlbmRpdHVyZXNcIikgYW5kIChpdGVtLmNhcHRpb24gaXNudCBcIlRvdGFsIEV4cGVuZGl0dXJlc1wiKVxuXG4gICAgICAgICAgICAgICAgICByID0gW1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmNhcHRpb25cbiAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQgaXRlbS50b3RhbGZ1bmRzXG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICByb3dzLnB1c2gocilcblxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRSb3dzIHJvd3NcbiAgICAgICAgICAgICAgb3B0aW9ucyA9XG4gICAgICAgICAgICAgICAgJ3RpdGxlJzonVG90YWwgRXhwZW5kaXR1cmVzJ1xuICAgICAgICAgICAgICAgICd0aXRsZVRleHRTdHlsZSc6XG4gICAgICAgICAgICAgICAgICdmb250U2l6ZSc6IDE2XG4gICAgICAgICAgICAgICAgJ3Rvb2x0aXAnOlxuICAgICAgICAgICAgICAgICAndGV4dFN0eWxlJzpcbiAgICAgICAgICAgICAgICAgICdmb250U2l6ZSc6IDEyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogYmlnQ2hhcnRXaWR0aFxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAzNTBcbiAgICAgICAgICAgICAgICAncGllU3RhcnRBbmdsZSc6IDYwXG4gICAgICAgICAgICAgICAgJ3NsaWNlVmlzaWJpbGl0eVRocmVzaG9sZCc6IC4wNVxuICAgICAgICAgICAgICAgICdmb3JjZUlGcmFtZSc6IHRydWVcbiAgICAgICAgICAgICAgICAnY2hhcnRBcmVhJzp7XG4gICAgICAgICAgICAgICAgICAgd2lkdGg6JzkwJSdcbiAgICAgICAgICAgICAgICAgICBoZWlnaHQ6Jzc1JSdcbiAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICMnaXMzRCcgOiAndHJ1ZSdcbiAgICAgICAgICAgICAgaWYgZ3JhcGhcbiAgICAgICAgICAgICAgICBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5QaWVDaGFydCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAndG90YWwtZXhwZW5kaXR1cmVzLXBpZSdcbiAgICAgICAgICAgICAgICBjaGFydC5kcmF3IHZpc19kYXRhLCBvcHRpb25zXG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgKSwgMTAwMFxuICAgICAgICAgIGlmIGdyYXBoXG4gICAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxuICAgICAgICAgICAgJ2NhbGxiYWNrJyA6IGRyYXdDaGFydCgpXG4gICAgICAgICAgICAncGFja2FnZXMnIDonY29yZWNoYXJ0J1xuICAgICAgICAgIHBsb3RfaGFuZGxlc1sndG90YWwtZXhwZW5kaXR1cmVzLXBpZSddID0ndG90YWwtZXhwZW5kaXR1cmVzLXBpZSdcbiAgICAgIGVsc2VcbiAgICAgICAgZGV0YWlsX2RhdGEudGFiY29udGVudCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXG5cbiAgICBsYXlvdXRfZGF0YS50YWJjb250ZW50ICs9IHRlbXBsYXRlc1sndGFiZGV0YWlsLXRlbXBsYXRlJ10oZGV0YWlsX2RhdGEpXG4gIHJldHVybiB0ZW1wbGF0ZXNbJ3RhYnBhbmVsLXRlbXBsYXRlJ10obGF5b3V0X2RhdGEpXG5cblxuZ2V0X2xheW91dF9maWVsZHMgPSAobGEpIC0+XG4gIGYgPSB7fVxuICBmb3IgdCBpbiBsYVxuICAgIGZvciBmaWVsZCBpbiB0LmZpZWxkc1xuICAgICAgZltmaWVsZF0gPSAxXG4gIHJldHVybiBmXG5cbmdldF9yZWNvcmRfZmllbGRzID0gKHIpIC0+XG4gIGYgPSB7fVxuICBmb3IgZmllbGRfbmFtZSBvZiByXG4gICAgZltmaWVsZF9uYW1lXSA9IDFcbiAgcmV0dXJuIGZcblxuZ2V0X3VubWVudGlvbmVkX2ZpZWxkcyA9IChsYSwgcikgLT5cbiAgbGF5b3V0X2ZpZWxkcyA9IGdldF9sYXlvdXRfZmllbGRzIGxhXG4gIHJlY29yZF9maWVsZHMgPSBnZXRfcmVjb3JkX2ZpZWxkcyByXG4gIHVubWVudGlvbmVkX2ZpZWxkcyA9IFtdXG4gIHVubWVudGlvbmVkX2ZpZWxkcy5wdXNoKGYpIGZvciBmIG9mIHJlY29yZF9maWVsZHMgd2hlbiBub3QgbGF5b3V0X2ZpZWxkc1tmXVxuICByZXR1cm4gdW5tZW50aW9uZWRfZmllbGRzXG5cblxuYWRkX290aGVyX3RhYl90b19sYXlvdXQgPSAobGF5b3V0PVtdLCBkYXRhKSAtPlxuICAjY2xvbmUgdGhlIGxheW91dFxuICBsID0gJC5leHRlbmQgdHJ1ZSwgW10sIGxheW91dFxuICB0ID1cbiAgICBuYW1lOiBcIk90aGVyXCJcbiAgICBmaWVsZHM6IGdldF91bm1lbnRpb25lZF9maWVsZHMgbCwgZGF0YVxuXG4gIGwucHVzaCB0XG4gIHJldHVybiBsXG5cblxuIyBjb252ZXJ0cyB0YWIgdGVtcGxhdGUgZGVzY3JpYmVkIGluIGdvb2dsZSBmdXNpb24gdGFibGUgdG9cbiMgdGFiIHRlbXBsYXRlXG5jb252ZXJ0X2Z1c2lvbl90ZW1wbGF0ZT0odGVtcGwpIC0+XG4gIHRhYl9oYXNoPXt9XG4gIHRhYnM9W11cbiAgIyByZXR1cm5zIGhhc2ggb2YgZmllbGQgbmFtZXMgYW5kIHRoZWlyIHBvc2l0aW9ucyBpbiBhcnJheSBvZiBmaWVsZCBuYW1lc1xuICBnZXRfY29sX2hhc2ggPSAoY29sdW1ucykgLT5cbiAgICBjb2xfaGFzaCA9e31cbiAgICBjb2xfaGFzaFtjb2xfbmFtZV09aSBmb3IgY29sX25hbWUsaSBpbiB0ZW1wbC5jb2x1bW5zXG4gICAgcmV0dXJuIGNvbF9oYXNoXG5cbiAgIyByZXR1cm5zIGZpZWxkIHZhbHVlIGJ5IGl0cyBuYW1lLCBhcnJheSBvZiBmaWVsZHMsIGFuZCBoYXNoIG9mIGZpZWxkc1xuICB2YWwgPSAoZmllbGRfbmFtZSwgZmllbGRzLCBjb2xfaGFzaCkgLT5cbiAgICBmaWVsZHNbY29sX2hhc2hbZmllbGRfbmFtZV1dXG5cbiAgIyBjb252ZXJ0cyBoYXNoIHRvIGFuIGFycmF5IHRlbXBsYXRlXG4gIGhhc2hfdG9fYXJyYXkgPShoYXNoKSAtPlxuICAgIGEgPSBbXVxuICAgIGZvciBrIG9mIGhhc2hcbiAgICAgIHRhYiA9IHt9XG4gICAgICB0YWIubmFtZT1rXG4gICAgICB0YWIuZmllbGRzPWhhc2hba11cbiAgICAgIGEucHVzaCB0YWJcbiAgICByZXR1cm4gYVxuXG5cbiAgY29sX2hhc2ggPSBnZXRfY29sX2hhc2godGVtcGwuY29sX2hhc2gpXG4gIHBsYWNlaG9sZGVyX2NvdW50ID0gMFxuXG4gIGZvciByb3csaSBpbiB0ZW1wbC5yb3dzXG4gICAgY2F0ZWdvcnkgPSB2YWwgJ2dlbmVyYWxfY2F0ZWdvcnknLCByb3csIGNvbF9oYXNoXG4gICAgI3RhYl9oYXNoW2NhdGVnb3J5XT1bXSB1bmxlc3MgdGFiX2hhc2hbY2F0ZWdvcnldXG4gICAgZmllbGRuYW1lID0gdmFsICdmaWVsZF9uYW1lJywgcm93LCBjb2xfaGFzaFxuICAgIGlmIG5vdCBmaWVsZG5hbWUgdGhlbiBmaWVsZG5hbWUgPSBcIl9cIiArIFN0cmluZyArK3BsYWNlaG9sZGVyX2NvdW50XG4gICAgZmllbGROYW1lc1t2YWwgJ2ZpZWxkX25hbWUnLCByb3csIGNvbF9oYXNoXT12YWwgJ2Rlc2NyaXB0aW9uJywgcm93LCBjb2xfaGFzaFxuICAgIGZpZWxkTmFtZXNIZWxwW2ZpZWxkbmFtZV0gPSB2YWwgJ2hlbHBfdGV4dCcsIHJvdywgY29sX2hhc2hcbiAgICBpZiBjYXRlZ29yeVxuICAgICAgdGFiX2hhc2hbY2F0ZWdvcnldPz1bXVxuICAgICAgdGFiX2hhc2hbY2F0ZWdvcnldLnB1c2ggbjogdmFsKCduJywgcm93LCBjb2xfaGFzaCksIG5hbWU6IGZpZWxkbmFtZSwgbWFzazogdmFsKCdtYXNrJywgcm93LCBjb2xfaGFzaClcblxuICBjYXRlZ29yaWVzID0gT2JqZWN0LmtleXModGFiX2hhc2gpXG4gIGNhdGVnb3JpZXNfc29ydCA9IHt9XG4gIGZvciBjYXRlZ29yeSBpbiBjYXRlZ29yaWVzXG4gICAgaWYgbm90IGNhdGVnb3JpZXNfc29ydFtjYXRlZ29yeV1cbiAgICAgIGNhdGVnb3JpZXNfc29ydFtjYXRlZ29yeV0gPSB0YWJfaGFzaFtjYXRlZ29yeV1bMF0ublxuICAgIGZpZWxkcyA9IFtdXG4gICAgZm9yIG9iaiBpbiB0YWJfaGFzaFtjYXRlZ29yeV1cbiAgICAgIGZpZWxkcy5wdXNoIG9ialxuICAgIGZpZWxkcy5zb3J0IChhLGIpIC0+XG4gICAgICByZXR1cm4gYS5uIC0gYi5uXG4gICAgdGFiX2hhc2hbY2F0ZWdvcnldID0gZmllbGRzXG5cbiAgY2F0ZWdvcmllc19hcnJheSA9IFtdXG4gIGZvciBjYXRlZ29yeSwgbiBvZiBjYXRlZ29yaWVzX3NvcnRcbiAgICBjYXRlZ29yaWVzX2FycmF5LnB1c2ggY2F0ZWdvcnk6IGNhdGVnb3J5LCBuOiBuXG4gIGNhdGVnb3JpZXNfYXJyYXkuc29ydCAoYSxiKSAtPlxuICAgIHJldHVybiBhLm4gLSBiLm5cblxuICB0YWJfbmV3aGFzaCA9IHt9XG4gIGZvciBjYXRlZ29yeSBpbiBjYXRlZ29yaWVzX2FycmF5XG4gICAgdGFiX25ld2hhc2hbY2F0ZWdvcnkuY2F0ZWdvcnldID0gdGFiX2hhc2hbY2F0ZWdvcnkuY2F0ZWdvcnldXG5cbiAgdGFicyA9IGhhc2hfdG9fYXJyYXkodGFiX25ld2hhc2gpXG4gIHJldHVybiB0YWJzXG5cblxuY2xhc3MgVGVtcGxhdGVzMlxuXG4gIEBsaXN0ID0gdW5kZWZpbmVkXG4gIEB0ZW1wbGF0ZXMgPSB1bmRlZmluZWRcbiAgQGRhdGEgPSB1bmRlZmluZWRcbiAgQGV2ZW50cyA9IHVuZGVmaW5lZFxuXG4gIGNvbnN0cnVjdG9yOigpIC0+XG4gICAgQGxpc3QgPSBbXVxuICAgIEBldmVudHMgPSB7fVxuICAgIHRlbXBsYXRlTGlzdCA9IFsndGFicGFuZWwtdGVtcGxhdGUnLCAndGFiZGV0YWlsLXRlbXBsYXRlJywgJ3RhYmRldGFpbC1uYW1ldmFsdWUtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWZpbnN0YXRlbWVudC10ZW1wbGF0ZScsICd0YWJkZXRhaWwtb2ZmaWNpYWwtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWVtcGxveWVlLWNvbXAtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWZpbmFuY2lhbC1oZWFsdGgtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWZpbmFuY2lhbC1zdGF0ZW1lbnRzLXRlbXBsYXRlJywgJ3BlcnNvbi1pbmZvLXRlbXBsYXRlJ11cbiAgICB0ZW1wbGF0ZVBhcnRpYWxzID0gWyd0YWItdGVtcGxhdGUnXVxuICAgIEB0ZW1wbGF0ZXMgPSB7fVxuICAgIGZvciB0ZW1wbGF0ZSxpIGluIHRlbXBsYXRlTGlzdFxuICAgICAgQHRlbXBsYXRlc1t0ZW1wbGF0ZV0gPSBIYW5kbGViYXJzLmNvbXBpbGUoJCgnIycgKyB0ZW1wbGF0ZSkuaHRtbCgpKVxuICAgIGZvciB0ZW1wbGF0ZSxpIGluIHRlbXBsYXRlUGFydGlhbHNcbiAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJQYXJ0aWFsKHRlbXBsYXRlLCAkKCcjJyArIHRlbXBsYXRlKS5odG1sKCkpXG5cbiAgYWRkX3RlbXBsYXRlOiAobGF5b3V0X25hbWUsIGxheW91dF9qc29uKSAtPlxuICAgIEBsaXN0LnB1c2hcbiAgICAgIHBhcmVudDp0aGlzXG4gICAgICBuYW1lOmxheW91dF9uYW1lXG4gICAgICByZW5kZXI6KGRhdCkgLT5cbiAgICAgICAgQHBhcmVudC5kYXRhID0gZGF0XG4gICAgICAgIHJlbmRlcl90YWJzKGxheW91dF9qc29uLCBkYXQsIHRoaXMsIEBwYXJlbnQpXG4gICAgICBiaW5kOiAodHBsX25hbWUsIGNhbGxiYWNrKSAtPlxuICAgICAgICBpZiBub3QgQHBhcmVudC5ldmVudHNbdHBsX25hbWVdXG4gICAgICAgICAgQHBhcmVudC5ldmVudHNbdHBsX25hbWVdID0gW2NhbGxiYWNrXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHBhcmVudC5ldmVudHNbdHBsX25hbWVdLnB1c2ggY2FsbGJhY2tcbiAgICAgIGFjdGl2YXRlOiAodHBsX25hbWUpIC0+XG4gICAgICAgIGlmIEBwYXJlbnQuZXZlbnRzW3RwbF9uYW1lXVxuICAgICAgICAgIGZvciBlLGkgaW4gQHBhcmVudC5ldmVudHNbdHBsX25hbWVdXG4gICAgICAgICAgICBlIHRwbF9uYW1lLCBAcGFyZW50LmRhdGFcblxuICBsb2FkX3RlbXBsYXRlOih0ZW1wbGF0ZV9uYW1lLCB1cmwpIC0+XG4gICAgJC5hamF4XG4gICAgICB1cmw6IHVybFxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgY2FjaGU6IHRydWVcbiAgICAgIHN1Y2Nlc3M6ICh0ZW1wbGF0ZV9qc29uKSA9PlxuICAgICAgICBAYWRkX3RlbXBsYXRlKHRlbXBsYXRlX25hbWUsIHRlbXBsYXRlX2pzb24pXG4gICAgICAgIHJldHVyblxuXG4gIGxvYWRfZnVzaW9uX3RlbXBsYXRlOih0ZW1wbGF0ZV9uYW1lLCB1cmwpIC0+XG4gICAgJC5hamF4XG4gICAgICB1cmw6IHVybFxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgY2FjaGU6IHRydWVcbiAgICAgIHN1Y2Nlc3M6ICh0ZW1wbGF0ZV9qc29uKSA9PlxuICAgICAgICB0ID0gY29udmVydF9mdXNpb25fdGVtcGxhdGUgdGVtcGxhdGVfanNvblxuICAgICAgICBAYWRkX3RlbXBsYXRlKHRlbXBsYXRlX25hbWUsIHQpXG4gICAgICAgIHJldHVyblxuXG5cbiAgZ2V0X25hbWVzOiAtPlxuICAgICh0Lm5hbWUgZm9yIHQgaW4gQGxpc3QpXG5cbiAgZ2V0X2luZGV4X2J5X25hbWU6IChuYW1lKSAtPlxuICAgIGZvciB0LGkgaW4gQGxpc3RcbiAgICAgIGlmIHQubmFtZSBpcyBuYW1lXG4gICAgICAgIHJldHVybiBpXG4gICAgIHJldHVybiAtMVxuXG4gIGdldF9odG1sOiAoaW5kLCBkYXRhKSAtPlxuICAgIGlmIChpbmQgaXMgLTEpIHRoZW4gcmV0dXJuICBcIlwiXG5cbiAgICBpZiBAbGlzdFtpbmRdXG4gICAgICByZXR1cm4gQGxpc3RbaW5kXS5yZW5kZXIoZGF0YSlcbiAgICBlbHNlXG4gICAgICByZXR1cm4gXCJcIlxuXG4gIGFjdGl2YXRlOiAoaW5kLCB0cGxfbmFtZSkgLT5cbiAgICBpZiBAbGlzdFtpbmRdXG4gICAgICBAbGlzdFtpbmRdLmFjdGl2YXRlIHRwbF9uYW1lXG5cbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGVzMlxuIl19
