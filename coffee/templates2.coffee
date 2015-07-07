
###
# file: templates2.coffee ----------------------------------------------------------------------
#
# Class to manage templates and render data on html page.
#
# The main method : render(data), get_html(data)
#-------------------------------------------------------------------------------------------------
###



# LOAD FIELD NAMES 
fieldNames = {}


render_field_value = (n,mask,data) ->
  v=data[n]
  if not data[n]
    return ''

  if n == "web_site"
    return "<a target='_blank' href='#{v}'>#{v}</a>"
  else
    if '' != mask
      return numeral(v).format(mask)
    else 
      if v.length > 20 and
      n == "open_enrollment_schools"
      then v = v.substring(0, 19) + "…<div style='display:inline;color:#074d71'  class='tooltipgo' data-toggle='tooltip' title='#{v}'>Read More</div>"
      else
        return v



render_field_name = (fName) ->
  if fieldNames[fName]?
    return fieldNames[fName]

  s = fName.replace(/_/g," ")
  s = s.charAt(0).toUpperCase() + s.substring(1)
  return s


render_field = (fName,data)->
  if "_" == substr fName, 0, 1
    """
    <div>
        <span class='f-nam'>#{render_field_name fName}</span>
        <span class='f-val'>&nbsp;</span>
    </div>
    """
  else
    return '' unless fValue = data[fName]
    """
    <div>
        <span class='f-nam'>#{render_field_name fName}</span>
        <span class='f-val'>#{render_field_value(fName,data)}</span>
    </div>
    """

render_subheading = (fName, mask, notFirst)->
  s = ''
  fName = render_field_name fName
  if mask == "heading"
    if notFirst != 0
      s += "<br/>"
    s += "<div><span class='f-nam'>#{fName}</span><span class='f-val'> </span></div>"
  return s

render_fields = (fields,data,template)->
  h = ''
  for field,i in fields
    if (typeof field is "object")
      if field.mask == "heading"
        h += render_subheading(field.name, field.mask, i)
        fValue = ''
      else 
        fValue = render_field_value field.name, field.mask, data
        if ('' != fValue)
          fName = render_field_name field.name
    else
      fValue = render_field_value field, '', data
      if ('' != fValue)
        fName = render_field_name field
    if ('' != fValue)
      h += template(name: fName, value: fValue)
  return h

render_financial_fields = (data,template)->
  h = ''
  mask = '0,0'
  category = ''
  for field in data
    if category != field.category_name
      category = field.category_name
      if category == 'Overview' 
        h += template(name: "<b>" + category + "</b>", genfund: '', otherfunds: '', totalfunds: '')
      else if category == 'Revenues'
        h += '</br>' 
        h += "<b>" + template(name: category, genfund: "General Fund", otherfunds: "Other Funds", totalfunds: "Total Gov. Funds") + "</b>"
      else 
        h += '</br>'
        h += template(name: "<b>" + category + "</b>", genfund: '', otherfunds: '', totalfunds: '')
    if field.caption == 'General Fund Balance' or field.caption == 'Long Term Debt'
      h += template(name: field.caption, genfund: numeral(field.genfund).format(mask))
    else 
      h += template(name: field.caption, genfund: numeral(field.genfund).format(mask), otherfunds: numeral(field.otherfunds).format(mask), totalfunds: numeral(field.totalfunds).format(mask))
  return h

under = (s) -> s.replace(/[\s\+\-]/g, '_')


render_tabs = (initial_layout, data, tabset, parent) ->
  #layout = add_other_tab_to_layout initial_layout, data
  layout = initial_layout
  templates = parent.templates
  plot_handles = {}

  layout_data =
    title: data.gov_name
    wikipedia_page_exists: data.wikipedia_page_exists
    wikipedia_page_name:  data.wikipedia_page_name
    transparent_california_page_name: data.transparent_california_page_name
    tabs: []
    tabcontent: ''
  
  for tab,i in layout
    layout_data.tabs.push
      tabid: under(tab.name),
      tabname: tab.name,
      active: (if i>0 then '' else 'active')

  for tab,i in layout
    detail_data =
      tabid: under(tab.name),
      tabname: tab.name,
      active: (if i>0 then '' else 'active')
      tabcontent: ''
    switch tab.name
      when 'Overview + Elected Officials'
        detail_data.tabcontent += render_fields tab.fields, data, templates['tabdetail-namevalue-template']
        for official,i in data.elected_officials.record
          official_data =
            title: if '' != official.title then "Title: " + official.title else ''
            name: if '' != official.full_name then "Name: " + official.full_name else ''
            email: if null != official.email_address then "Email: " + official.email_address else 'Email: '
            telephonenumber: if null != official.telephone_number and undefined != official.telephone_number then "Telephone Number:" + official.telephone_number else "Telephone Number:"
            termexpires: if null != official.term_expires then "Term Expires: " + official.term_expires else 'Term Expires: '
          official_data.image = '<img src="'+official.photo_url+'" class="portrait" alt="" />' if '' != official.photo_url
          detail_data.tabcontent += templates['tabdetail-official-template'](official_data)
      when 'Employee Compensation'
        h = ''
        h += render_fields tab.fields, data, templates['tabdetail-namevalue-template']
        detail_data.tabcontent += templates['tabdetail-employee-comp-template'](content: h)
        if not plot_handles['median-comp-graph']   
          drawChart = () -> 
            setTimeout ( ->
              vis_data = new google.visualization.DataTable()
              vis_data.addColumn 'string', 'Median Compensation'
              vis_data.addColumn 'number', 'Wages'
              vis_data.addColumn 'number', 'Bens.'
              vis_data.addRows [
                [
                  'Full Time Employees'
                  data['median_salary_per_full_time_emp']
                  data['median_benefits_per_ft_emp']
                ]
                [
                  'General Public'
                  data['median_wages_general_public']
                  data['median_benefits_general_public']
                ]
              ]
              formatter = new google.visualization.NumberFormat(groupingSymbol: ',' , fractionDigits: '0')
              formatter.format(vis_data, 1);
              formatter.format(vis_data, 2);              
              options =
                'title':'Median Total Compensation'
                'width': 340
                'height': 300
                'isStacked': 'true'
                'colors': ['#005ce6', '#009933']
              chart = new google.visualization.ColumnChart document.getElementById 'median-comp-graph'
              chart.draw vis_data, options
              return
            ), 1000
          google.load 'visualization', '1.0',
          'callback' : drawChart()
          'packages' :'corechart'
          plot_handles['median-comp-graph'] ='median-comp-graph'
        if not plot_handles['median-pension-graph']   
          drawChart = () -> 
            setTimeout ( ->
              vis_data = new google.visualization.DataTable()
              vis_data.addColumn 'string', 'Median Pension'
              vis_data.addColumn 'number', 'Wages'
              vis_data.addColumn 'number', 'Bens.'
              vis_data.addRows [
                [
                  'Pension for \n Retiree w/ 30 Years'
                  data['median_pension_30_year_retiree']
                  0
                ]
                [
                  'General Public'
                  data['median_wages_general_public']
                  data['median_benefits_general_public']
                ]
              ]
              formatter = new google.visualization.NumberFormat(groupingSymbol: ',' , fractionDigits: '0')
              formatter.format(vis_data, 1);
              formatter.format(vis_data, 2);
              options =
                'title':'Median Total Pension'
                'width': 340
                'height': 300
                'isStacked': 'true'
                'colors': ['#005ce6', '#009933']
                'chartArea.width': '50%'
              chart = new google.visualization.ColumnChart document.getElementById 'median-pension-graph' 
              chart.draw vis_data, options
              return
            ), 1000
          google.load 'visualization', '1.0',
          'callback' : drawChart()
          'packages' :'corechart'
          plot_handles['median-pension-graph'] ='median-pension-graph'
      when 'Financial Health'
        h = ''
        h += render_fields tab.fields, data, templates['tabdetail-namevalue-template']
        detail_data.tabcontent += templates['tabdetail-financial-health-template'](content: h)
        if not plot_handles['public-safety-pie']            
            drawChart = () -> 
            setTimeout ( ->
              vis_data = new google.visualization.DataTable()
              vis_data.addColumn 'string', 'Public safety expense'
              vis_data.addColumn 'number', 'Total'
              vis_data.addRows [
                [
                  'Public Safety Expense'
                  100 - data['public_safety_exp_over_tot_gov_fund_revenue']
                ]                
                [
                  'Other Governmental \n Fund Revenue'
                  data['public_safety_exp_over_tot_gov_fund_revenue']
                ]
              ]
              options =
                'title':'Public safety expense'
                'width': 340
                'height': 300
                'is3D' : 'true'
                'colors': ['#005ce6', '#009933']
                'slices': { 1: {offset: 0.2}}
                'pieStartAngle': 20
              chart = new google.visualization.PieChart document.getElementById 'public-safety-pie' 
              chart.draw vis_data, options
              return
            ), 1000
          google.load 'visualization', '1.0',
          'callback' : drawChart()
          'packages' :'corechart'
          plot_handles['public-safety-pie'] ='public-safety-pie'
      when 'Financial Statements'
        if data.financial_statements
          h = ''
          #h += render_fields tab.fields, data, templates['tabdetail-namevalue-template']
          h += render_financial_fields data.financial_statements, templates['tabdetail-finstatement-template']
          detail_data.tabcontent += templates['tabdetail-financial-statements-template'](content: h)
          #tabdetail-financial-statements-template
      else
        detail_data.tabcontent += render_fields tab.fields, data, templates['tabdetail-namevalue-template']
    
    layout_data.tabcontent += templates['tabdetail-template'](detail_data)
  return templates['tabpanel-template'](layout_data)


get_layout_fields = (la) ->
  f = {}
  for t in la
    for field in t.fields
      f[field] = 1
  return f

get_record_fields = (r) ->
  f = {}
  for field_name of r
    f[field_name] = 1
  return f

get_unmentioned_fields = (la, r) ->
  layout_fields = get_layout_fields la
  record_fields = get_record_fields r
  unmentioned_fields = []
  unmentioned_fields.push(f) for f of record_fields when not layout_fields[f]
  return unmentioned_fields


add_other_tab_to_layout = (layout=[], data) ->
  #clone the layout
  l = $.extend true, [], layout
  t =
    name: "Other"
    fields: get_unmentioned_fields l, data

  l.push t
  return l


# converts tab template described in google fusion table to 
# tab template
convert_fusion_template=(templ) ->
  tab_hash={}
  tabs=[]
  # returns hash of field names and their positions in array of field names
  get_col_hash = (columns) ->
    col_hash ={}
    col_hash[col_name]=i for col_name,i in templ.columns
    return col_hash
  
  # returns field value by its name, array of fields, and hash of fields
  val = (field_name, fields, col_hash) ->
    fields[col_hash[field_name]]
  
  # converts hash to an array template
  hash_to_array =(hash) ->
    a = []
    for k of hash
      tab = {}
      tab.name=k
      tab.fields=hash[k]
      a.push tab
    return a

    
  col_hash = get_col_hash(templ.col_hash)
  placeholder_count = 0
  
  for row,i in templ.rows
    category = val 'general_category', row, col_hash
    #tab_hash[category]=[] unless tab_hash[category]
    fieldname = val 'field_name', row, col_hash
    if not fieldname then fieldname = "_" + String ++placeholder_count
    fieldNames[val 'field_name', row, col_hash]=val 'description', row, col_hash
    if category
      tab_hash[category]?=[]
      tab_hash[category].push n: val('n', row, col_hash), name: fieldname, mask: val('mask', row, col_hash)

  categories = Object.keys(tab_hash)
  categories_sort = {}
  for category in categories
    if not categories_sort[category]
      categories_sort[category] = tab_hash[category][0].n
    fields = []
    for obj in tab_hash[category]
      fields.push obj
    fields.sort (a,b) ->
      return a.n - b.n
    tab_hash[category] = fields

  categories_array = []
  for category, n of categories_sort
    categories_array.push category: category, n: n
  categories_array.sort (a,b) ->
    return a.n - b.n

  tab_newhash = {}
  for category in categories_array
    tab_newhash[category.category] = tab_hash[category.category]

  tabs = hash_to_array(tab_newhash)
  return tabs


class Templates2

  @list = undefined
  @templates = undefined
  @data = undefined
  @events = undefined

  constructor:() ->
    @list = []
    @events = {}
    templateList = ['tabpanel-template', 'tabdetail-template', 'tabdetail-namevalue-template', 'tabdetail-finstatement-template', 'tabdetail-official-template', 'tabdetail-employee-comp-template', 'tabdetail-financial-health-template', 'tabdetail-financial-statements-template']
    templatePartials = ['tab-template']
    @templates = {}
    for template,i in templateList
      @templates[template] = Handlebars.compile($('#' + template).html())
    for template,i in templatePartials
      Handlebars.registerPartial(template, $('#' + template).html())

  add_template: (layout_name, layout_json) ->
    @list.push
      parent:this
      name:layout_name
      render:(dat) ->
        @parent.data = dat
        render_tabs(layout_json, dat, this, @parent)
      bind: (tpl_name, callback) ->
        if not @parent.events[tpl_name]
          @parent.events[tpl_name] = [callback]
        else
          @parent.events[tpl_name].push callback
      activate: (tpl_name) ->
        if @parent.events[tpl_name]
          for e,i in @parent.events[tpl_name]
            e tpl_name, @parent.data

  load_template:(template_name, url) ->
    $.ajax
      url: url
      dataType: 'json'
      cache: true
      success: (template_json) =>
        @add_template(template_name, template_json)
        return

  load_fusion_template:(template_name, url) ->
    $.ajax
      url: url
      dataType: 'json'
      cache: true
      success: (template_json) =>
        t = convert_fusion_template template_json
        @add_template(template_name, t)
        return


  get_names: ->
    (t.name for t in @list)

  get_index_by_name: (name) ->
    for t,i in @list
      if t.name is name
        return i
     return -1

  get_html: (ind, data) ->
    if (ind is -1) then return  ""
    
    if @list[ind]
      return @list[ind].render(data)
    else
      return ""

  activate: (ind, tpl_name) ->
    if @list[ind]
      @list[ind].activate tpl_name

module.exports = Templates2
