$ ->
  #$('#getWikipediaArticleButton').on 'click', ->
  #  $(this).toggleClass('active')
  #alertalert "hi"
  #alert $("#wikipediaPageName").text()
  #get_wikipedia_article()
  window.get_wikipedia_article = get_wikipedia_article
  window.create_wikipedia_article = create_wikipedia_article

get_wikipedia_article=(s)->
  article_name = s.replace /.*\/([^/]*)$/, "$1"
  $.getJSON "http://en.wikipedia.org/w/api.php?action=parse&page=#{article_name}&prop=text&format=json&callback=?", (json) -> 
    $('#wikipediaTitle').html json.parse.title
    $('#wikipediaArticle').html json.parse.text["*"]
    $("#wikipediaArticle").find("a:not(.references a)").attr "href", ->  "http://www.wikipedia.org" + $(this).attr("href")
    $("#wikipediaArticle").find("a").attr "target", "_blank"
  
create_wikipedia_article= ->
  alert "Not implemented"

module.exports =
  get_wikipedia_article:get_wikipedia_article
