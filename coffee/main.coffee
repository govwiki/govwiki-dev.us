###
file: main.coffe -- The entry -----------------------------------------------------------------------------------
  :
gov_finder = new GovFinder
gov_details = new GovDetails
gov_finder.on_select = gov_details.show
-----------------------------------------------------------------------------------------------------------------
###

GovSelector = require './govselector.coffee'
#_jqgs       = require './jquery.govselector.coffee'
Templates2      = require './templates2.coffee'
wikipedia   = require './wikipedia.coffee'

govmap = null
gov_selector = null
templates = new Templates2
active_tab=""
undef = null

Handlebars.registerHelper 'if_eq', (a, b, opts) ->
    if `a == b`
        return opts.fn this
    else
        return opts.inverse this

#scrollto = require '../bower_components/jquery.scrollTo/jquery.scrollTo.js'

window.GOVWIKI =
  state_filter : ''
  gov_type_filter : ''
  gov_type_filter_2 : ['City', 'School District', 'Special District']

  show_search_page: () ->
    $(window).scrollTo('0px',10)
    $('#dataContainer').hide()
    $('#searchIcon').hide()
    $('#searchContainer').fadeIn(300)
    focus_search_field 500

  show_data_page: () ->
    $(window).scrollTo('0px',10)
    $('#searchIcon').show()
    $('#dataContainer').fadeIn(300)
    $('#searchContainer').hide()
    #$(window).scrollTo('#pBackToSearch',600)

#gov_selector = new GovSelector '.typeahead', 'data/h_types.json', 7
#gov_selector = new GovSelector '.typeahead', 'http://46.101.3.79/rest/db/govs?filter=state=%22CA%22&app_name=govwiki&fields=_id,gov_name,gov_type,state&limit=5000', 7


GOVWIKI.get_counties = get_counties = (callback) ->
  $.ajax
    url: 'data/county_geography_ca.json'
    dataType: 'json'
    cache: true
    success: (countiesJSON) ->
      callback countiesJSON

GOVWIKI.draw_polygons = draw_polygons = (countiesJSON) ->
  for county in countiesJSON.features
    govmap.map.drawPolygon({
      paths: county.geometry.coordinates
      useGeoJSON: true
      strokeColor: '#808080'
      strokeOpacity: 0.6
      strokeWeight: 1.5
      fillColor: '#FF0000'
      fillOpacity: 0.15
      countyId: county.properties._id
      altName: county.properties.alt_name
      marker: new MarkerWithLabel({
        position: new google.maps.LatLng(0,0),
        draggable: false,
        raiseOnDrag: false,
        map: govmap.map.map,
        labelContent: county.properties.name,
        labelAnchor: new google.maps.Point(-15, 25),
        labelClass: "label-tooltip",
        labelStyle: {opacity: 1.0},
        icon: "http://placehold.it/1x1",
        visible: false
      })
      mouseover: ->
        this.setOptions({fillColor: "#00FF00"})
      mousemove: (event) ->
        this.marker.setPosition(event.latLng)
        this.marker.setVisible(true)
      mouseout: ->
        this.setOptions({fillColor: "#FF0000"})
        this.marker.setVisible(false)
      click: ->
        router.navigate "#{this.countyId}"
    })

window.remember_tab =(name)-> active_tab = name

#window.geocode_addr = (input_selector)-> govmap.gocode_addr $(input_selector).val()

$(document).on 'click', '#fieldTabs a', (e) ->
  active_tab = $(e.currentTarget).data('tabname')
  console.log active_tab
  $("#tabsContent .tab-pane").removeClass("active")
  $($(e.currentTarget).attr('href')).addClass("active")
  templates.activate 0, active_tab

  if active_tab == 'Financial Statements'
    finValWidthMax1 = 0
    finValWidthMax2 = 0
    finValWidthMax3 = 0

    $('.fin-values-block [data-col="1"]').find('.fin-val').each () ->
        thisFinValWidth = $(this).width()

        if thisFinValWidth > finValWidthMax1
            finValWidthMax1 = thisFinValWidth

    $('.fin-values-block [data-col="2"]').find('.fin-val').each () ->
        thisFinValWidth = $(this).width()

        if thisFinValWidth > finValWidthMax2
            finValWidthMax2 = thisFinValWidth

    $('.fin-values-block [data-col="3"]').find('.fin-val').each () ->
        thisFinValWidth = $(this).width()

        if thisFinValWidth > finValWidthMax3
            finValWidthMax3 = thisFinValWidth

    $('.fin-values-block [data-col="1"] .currency-sign').css('right', finValWidthMax1 + 27)
    $('.fin-values-block [data-col="2"] .currency-sign').css('right', finValWidthMax2 + 27)
    $('.fin-values-block [data-col="3"] .currency-sign').css('right', finValWidthMax3 + 27)


$(document).tooltip({selector: "[class='media-tooltip']",trigger:'click'})

activate_tab =() ->
  $("#fieldTabs a[href='#tab#{active_tab}']").tab('show')

get_record = (query) ->
  $.ajax
    url: "https://api.mongolab.com/api/1/databases/govwiki/collections/govs/?q={#{query}}&f={_id:0}&l=1&apiKey=0Y5X_Qk2uOJRdHJWJKSRWk6l6JqVTS2y"
    dataType: 'json'
    cache: true
    success: (data) ->
      if data.length
        $('#details').html templates.get_html(0, data[0])
        activate_tab()
        #govmap.geocode data[0]
      return
    error:(e) ->
      console.log e


get_record2 = (recid) ->
  # clear wikipedia place
  $("#wikipediaContainer").html("")
  $.ajax
    #url: "https://dsp-govwiki.cloud.dreamfactory.com:443/rest/govwiki_api/govs/#{recid}"
    url: "http://46.101.3.79:80/rest/db/govs/#{recid}"
    dataType: 'json'
    headers: {"X-DreamFactory-Application-Name":"govwiki"}
    cache: true
    success: (data) ->
      if data
        get_financial_statements data._id, (data2, textStatus, jqXHR) ->
          data.financial_statements = data2
          get_elected_officials data._id, 25, (data3, textStatus2, jqXHR2) ->
            data.elected_officials = data3
            get_max_ranks (max_ranks_response) ->
              data.max_ranks = max_ranks_response.record[0]
              $('#details').html templates.get_html(0, data)
              activate_tab()

        # fill wikipedia place
        #wpn = data.wikipedia_page_name
        #$("#wikipediaContainer").html(if wpn then wpn else "No Wikipedia article")

      return
    error:(e) ->
      console.log e


get_elected_officials = (gov_id, limit, onsuccess) ->
  $.ajax
    url:"http://46.101.3.79:80/rest/db/elected_officials"
    data:
      filter:"govs_id=" + gov_id
      fields:"govs_id,title,full_name,email_address,photo_url,term_expires,telephone_number"
      app_name:"govwiki"
      order:"display_order"
      limit:limit

    dataType: 'json'
    cache: true
    success: onsuccess
    error:(e) ->
      console.log e

get_financial_statements = (gov_id, onsuccess) ->
  $.ajax
    url:"http://46.101.3.79:80/rest/db/_proc/get_financial_statements"
    data:
      app_name:"govwiki"
      order:"caption_category,display_order"
      params: [
        name: "govs_id"
        param_type: "IN"
        value: gov_id
      ]

    dataType: 'json'
    cache: true
    success: onsuccess
    error:(e) ->
      console.log e


get_max_ranks = (onsuccess) ->
  $.ajax
    url:'http://46.101.3.79:80/rest/db/max_ranks'
    data:
      app_name:'govwiki'
    dataType: 'json'
    cache: true
    success: onsuccess

window.GOVWIKI.show_record =(rec)=>
  $('#details').html templates.get_html(0, rec)
  activate_tab()
  GOVWIKI.show_data_page()
  router.navigate(rec._id)


window.GOVWIKI.show_record2 =(rec)=>
  get_elected_officials rec._id, 25, (data, textStatus, jqXHR) ->
    rec.elected_officials = data
    $('#details').html templates.get_html(0, rec)
    get_record2 rec._id
    activate_tab()
    GOVWIKI.show_data_page()
    router.navigate "#{rec.alt_name.replace(/ /g,'_')}"



###
window.show_rec = (rec)->
  $('#details').html templates.get_html(0, rec)
  activate_tab()
###

build_selector = (container, text, command, where_to_store_value ) ->
  $.ajax
    url: 'https://api.mongolab.com/api/1/databases/govwiki/runCommand?apiKey=0Y5X_Qk2uOJRdHJWJKSRWk6l6JqVTS2y'
    type: 'POST'
    contentType: "application/json"
    dataType: 'json'
    data: command #JSON.stringify(command)
    cache: true
    success: (data) =>
      #a=$.extend true [],data
      values=data.values
      build_select_element container, text, values.sort(), where_to_store_value
      return
    error:(e) ->
      console.log e


build_select_element = (container, text, arr, where_to_store_value ) ->
  s  = "<select class='form-control' style='maxwidth:160px;'><option value=''>#{text}</option>"
  s += "<option value='#{v}'>#{v}</option>" for v in arr when v
  s += "</select>"
  select = $(s)
  $(container).append(select)

  # set default 'CA'
  if text is 'State..'
    select.val 'CA'
    window.GOVWIKI.state_filter='CA'
    govmap.on_bounds_changed_later()

  select.change (e) ->
    el = $(e.target)
    window.GOVWIKI[where_to_store_value] = el.val()
    $('.gov-counter').text gov_selector.count_govs()
    govmap.on_bounds_changed()


adjust_typeahead_width =() ->
  inp = $('#myinput')
  par = $('#typeahed-container')
  inp.width par.width()


start_adjusting_typeahead_width =() ->
  $(window).resize ->
    adjust_typeahead_width()


# add live reload to the site. For development only.
livereload = (port) ->
  url=window.location.origin.replace /:[^:]*$/, ""
  $.getScript url + ":" + port, =>
    $('body').append """
    <div style='position:absolute;z-index:1000;
    width:100%; top:0;color:red; text-align: center;
    padding:1px;font-size:10px;line-height:1'>live</div>
    """

focus_search_field = (msec) ->
  setTimeout (-> $('#myinput').focus()) ,msec



# quick and dirty fix for back button in browser
window.onhashchange = (e) ->
  h=window.location.hash
  #console.log "onHashChange #{h}"
  #console.log e
  if not h
    GOVWIKI.show_search_page()

# =====================================================================

#templates.load_template "tabs", "config/tablayout.json"


# fire client-side URL routing

router = new Grapnel

GOVWIKI.history = (index) ->
    if index == 0 then router.navigate ''; return false
    index = parseInt index
    href = window.location.href.split '/'
    console.log href
    router.navigate href[href.length-index]

router.get ':id/:user_id', (req, event) ->
    document.title = 'CPC Politician Profiles'
    $('#stantonIcon').show()
    $('#searchIcon').show()
    gov_id = req.params.id.substr(0)
    user_id = req.params.user_id
    $.ajax
        url:"http://46.101.3.79:80/rest/db/govs"
        data:
            filter: "_id=" + gov_id
            fields: "gov_name, alt_name"
            app_name:"govwiki"
        success: (data) ->
            gov_name = data.record[0].gov_name
            alt_name = data.record[0].alt_name
            votes = null
            contributions = null
            endorsements = null
            do (votes) =>
                $.ajax
                    url: "http://46.101.3.79:80/rest/db/_proc/getVotes?app_name=govwiki"
                    data:
                        app_name: "govwiki"
                        params: [{
                            "name": "id",
                            "param_type": "INT",
                            "value": user_id,
                            "type": "json",
                            "length": 0
                        }]
                    dataType: 'json'
                    success: (data) ->
                        for vote in data
                          vote.date_considered = new Date(vote.date_considered).toLocaleDateString()
                        votes = data
                        getContributions votes



            getContributions = (votes) ->
                $.ajax
                    url: "http://46.101.3.79:80/rest/db/_proc/getContributions?app_name=govwiki"
                    data:
                        app_name: "govwiki"
                        params: [{
                            "name": "id",
                            "param_type": "INT",
                            "value": user_id,
                            "type": "json",
                            "length": 0
                        }]
                    dataType: 'json'
                    success: (data) ->
                        for contribution in data
                          amount = numeral contribution.contribution_amount
                          formatted_amount = amount.format('0,000.00')
                          contribution.contribution_amount = formatted_amount
                        contributions = data
                        getEndorsements votes, contributions


            getEndorsements = (votes, contributions) ->
                $.ajax
                    url: "http://46.101.3.79:80/rest/db/_proc/getEndorsements?app_name=govwiki"
                    data:
                        app_name: "govwiki"
                        params: [{
                            "name": "id",
                            "param_type": "INT",
                            "value": user_id,
                            "type": "json",
                            "length": 0
                        }]
                    dataType: 'json'
                    success: (data) ->
                        endorsements = data
                        getElectedOffical votes, contributions, endorsements



            getElectedOffical = (votes, contributions, endorsements) ->
                $.ajax
                    url:"http://46.101.3.79:80/rest/db/elected_officials"
                    data:
                        filter: "elected_official_id=" + user_id
                        app_name:"govwiki"
                        limit: 25
                    dataType: 'json'
                    cache: true
                    success: (data) ->
                        person = data.record[0]
                        person.gov_name = gov_name
                        person.alt_name = alt_name
                        person.votes = votes
                        person.contributions = contributions
                        person.endorsements = endorsements
                        tpl = $('#person-info-template').html()
                        compiledTemplate = Handlebars.compile(tpl)
                        html = compiledTemplate(person)
                        $('#details').html html
                        $('#dataContainer').css('display':'block');
                        window.DISQUSWIDGETS.getCount()
                        $('.vote').on 'click', (e) ->
                            id = e.currentTarget.id
                            # If legislationName is undefined use person name
                            name = e.currentTarget.dataset.legislationName
                            if name is undefined then name = person.full_name
                            $('#myModalLabel').text(name + ' (' + alt_name + ')');
                            $('#conversation').modal 'show'
                            reset id, 'http://govwiki.us' + '/' + id, name
                    error:(e) ->
                        console.log e

# Refresh Disqus thread
reset = (newIdentifier, newUrl, newTitle) ->
    DISQUS.reset
        reload: true,
        config: () ->
            this.page.identifier = newIdentifier
            this.page.url = newUrl
            this.page.title = newTitle



$('#dataContainer').on 'click', '.elected_link', (e) ->
    router.navigate e.target.hash

router.get ':id', (req, event) ->
    document.title = 'CPC Civic Profiles'
    id = req.params.id
    $('#stantonIcon').hide()
    templates.load_fusion_template "tabs", "https://www.googleapis.com/fusiontables/v2/query?sql=SELECT%20*%20FROM%201z2oXQEYQ3p2OoMI8V5gKgHWB5Tz990BrQ1xc1tVo&key=AIzaSyCXDQyMDpGA2g3Qjuv4CDv7zRj-ix4IQJA"
    console.log "ROUTER ID=#{id}"
    get_elected_officials = (gov_id, limit, onsuccess) ->
        $.ajax
            url:"http://46.101.3.79:80/rest/db/elected_officials"
            data:
                filter:"govs_id=" + gov_id
                app_name:"govwiki"
                order:"display_order"
                limit:limit

            dataType: 'json'
            cache: true
            success: onsuccess
            error:(e) ->
                console.log e
    if isNaN(id)
        id = id.replace(/_/g,' ')
        build_data = (id, limit, onsuccess) ->
            $.ajax
                url:"http://46.101.3.79:80/rest/db/govs"
                data:
                    filter:"alt_name='#{id}'"
                    app_name:"govwiki"
                dataType: 'json'
                cache: true
                success: (data) ->
                    elected_officials = get_elected_officials data.record[0]._id, 25, (elected_officials_data, textStatus, jqXHR) ->
                        gov_id = data.record[0]._id
                        data = new Object()
                        data._id = gov_id
                        data.elected_officials = elected_officials_data
                        data.gov_name = ""
                        data.gov_type = ""
                        data.state = ""
                        $('#details').html templates.get_html(0, data)
                        get_record2 data._id
                        activate_tab()
                        GOVWIKI.show_data_page()
                        return
                error:(e) ->
                    console.log e
        build_data(id)
    else
        elected_officials = get_elected_officials id, 25, (elected_officials_data, textStatus, jqXHR) ->
            data = new Object()
            data._id = id
            data.elected_officials = elected_officials_data
            data.gov_name = ""
            data.gov_type = ""
            data.state = ""
            $('#details').html templates.get_html(0, data)
            get_record2 data._id
            activate_tab()
            GOVWIKI.show_data_page()
            return

router.get '', (req, event) ->
    gov_selector = new GovSelector '.typeahead', 'data/h_types_ca.json', 7
    gov_selector.on_selected = (evt, data, name) ->
        get_elected_officials data._id, 25, (data2, textStatus, jqXHR) ->
            data.elected_officials = data2
            $('#details').html templates.get_html(0, data)
            #get_record "inc_id:#{data["inc_id"]}"
            get_record2 data["_id"]
            activate_tab()
            GOVWIKI.show_data_page()
            router.navigate "#{data._id}"
            return

    if !undef
        $('#searchContainer').html $('#search-container-template').html()
        # Load introductory text from texts/intro-text.html to #intro-text container.
        $.get "texts/intro-text.html", (data) ->
            $("#intro-text").html data
        govmap = require './govmap.coffee'
        get_counties GOVWIKI.draw_polygons
        undef = true
    adjust_typeahead_width()
    start_adjusting_typeahead_width()
    build_selector('.state-container' , 'State..' , '{"distinct": "govs","key":"state"}' , 'state_filter')
    build_selector('.gov-type-container' , 'type of government..' , '{"distinct": "govs","key":"gov_type"}' , 'gov_type_filter')



$('#btnBackToSearch').click (e)->
  e.preventDefault()
  GOVWIKI.show_search_page()

#focus_search_field 500



livereload "9090"

