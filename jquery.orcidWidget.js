var $jq = jQuery.noConflict();
$jq(document).ready(function() {
  var widget = $jq('#orcid-widget-js').clone(),
    orcids = widget.data(orcids).orcids.split(","),
    profile = null;
  $jq(orcids).each(function(name, value) {
    var profile_promise = get_orcid_profile(value.trim());
    profile_promise.success(function(data) {
      profile = data['orcid-profile'];
      widget.append(set_widget_content(profile));
    });
  });

  $jq('#orcid-widget-js').replaceWith(widget);

  function set_widget_content() {
    var profile_div = $jq('<div class="orcid-profile">');
    set_person_works().appendTo(profile_div);
    var orcid_uri = profile['orcid-identifier']['uri'];
    var orcid_link = $jq('<a class="orcid-profile-uri">');
    orcid_link.attr("href", orcid_uri);
    orcid_link.text("View full profile at ORCID");
    orcid_link.appendTo(profile_div);
    return profile_div;
  }

  function get_orcid_profile(orcid) {
    var profile_uri = 'http://pub.orcid.org/v1.2/' + orcid + '/orcid-works';
    return $jq.ajax({
      url: profile_uri,
      type: 'GET',
      dataType: 'jsonp',
      accepts: 'application/orcid+json'
    });
  }

  function set_person_works() {
    orcid_path = profile['orcid-identifier']['path'];
    var data = profile['orcid-activities'];
    var span = $jq('<span class="orcid-works">');
    if (data['orcid-works']) {
      var works = data['orcid-works']['orcid-work'];
      span.append(list_person_works(works));
    } else {
      span.text("No works found.");
    }
    return span;
  }

  function list_person_works(works) {
    var seendois = [];
    var seentitles = [];
    var ul = $jq('<ul class="orcid-works">');
    var i = 1;
    $jq(works).each(function(index, value) {
      var title = value['work-title']['title'].value;
      //Check for and ignore duplicate works based on title
      if (jQuery.inArray(title, seentitles) === -1) {
        seentitles[seentitles.length] = title;
        var ib = i % 2;
        if (ib === 0) {
          var li = $jq('<li class="orcid-work">');
        } else {
          var li = $jq('<li class="orcid-work orcid-work-odd">');
        }
        i = i + 1;
        var divtitle = $jq('<div class="orcid-work-title">');
        if ( value['url']['value'] ) {
            var link = $jq('<a>');
            link.attr("href", value['url']['value']);
            link.text(title);
            link.appendTo(divtitle);
        } else {
          divtitle.text(title);
        }

        var journal = value['journal-title'] !== null ? value['journal-title'].value : "";
        var spanjournal = $jq('<span class="journal">');
        spanjournal.text(' ' + journal);

        spanjournal.appendTo(divtitle);

        if ( value['publication-date'] ) {
          var dateJson = value['publication-date'];
          var dateText = ( dateJson['year'] ) ? (dateJson['year']['value']+"-") : "";
          dateText += ( dateJson['month'] ) ? (dateJson['month']['value']+"-") : "";
          dateText += ( dateJson['day'] ) ? (dateJson['day']['value']+"-") : "";
          dateText = dateText.substr(0,dateText.length-1);
          var dateSpan = $jq('<span class="orcid-publication-date">');
          dateSpan.text(dateText);
          divtitle.append(dateSpan);
        }


        var author = "";
        var divauthors = $jq('<div class="work-authors">');

        var contributors = value['work-contributors'] !== null ? value['work-contributors']['contributor'] : "";
        $jq(contributors).each(function(index, value) {
          var author_orcid = value['contributor-orcid'] !== null ? value['contributor-orcid']['path'] : "";

          //combine the authors' names by span tag with different styles
          if (author_orcid === orcid_path) {
            author = value['credit-name'].value;
            span_author = $jq('<span class="author">');
            span_author.text(author + '; ');
            span_author.addClass("exp1");
          } else {
            author = value['credit-name'].value;
            span_author = $jq('<span class="author">');
            span_author.text(author + '; ');
          }

          span_author.appendTo(span_author);
          span_author.appendTo(divauthors);
        });

        var journal = value['journal-title'] !== null ? value['journal-title'].value : "";
        var type = value['work-type'] !== null ? value['work-type'] : "";
        var bibtex = value['work-citation']['work-citation-type'] === 'bibtex' ? value['work-citation']['citation'] : "";
        var description = value['short-description'] !== null ? value['short-description'] : "";

        divtitle.appendTo(li);
        divauthors.appendTo(li);

        if ( value['work-citation'] ){
          var divWS = $jq('<div class="orcid-citation">');
          divWS.text( value['work-citation']['citation']);
          divWS.appendTo( li );
        }

        var extids = value['work-external-identifiers'] !== null ? value['work-external-identifiers']['work-external-identifier'] : "";

        var extIdUl = $jq('<ul class="orcid-external-ids">');
        $jq(extids).each(function(index, value) {
          var itemLi = $jq("<li>");
          if (value['work-external-identifier-type'] === "DOI") {
            var doi = "";
            var doilink = "http://dx.doi.org/";
            doi = value['work-external-identifier-id'].value.toUpperCase();
            doilink += doi;
            var adoi = $jq('<a class="doi-link">');
            adoi.attr("href", doilink);
            adoi.text("DOI");
            adoi.appendTo(itemLi);

          } else if (value['work-external-identifier-type'] === "HANDLE") {
            var handlelink = "http://hdl.handle.net/";
            var handle = value['work-external-identifier-id'].value;
            handlelink += handle;
            var ahandle = $jq('<a class="handle-link">');
            ahandle.attr("href", handlelink);
            ahandle.text("HDL");
            ahandle.appendTo(itemLi);

          } else if (value['work-external-identifier-type'] === "ARXIV") {
            handlelink = "http://arxiv.org/abs/";
            handle = value['work-external-identifier-id']['value'];
            handlelink += handle;
            var ahandle = $jq('<a class="arxiv-link">');
            ahandle.attr("href", handlelink);
            ahandle.text("ArXiv");
            ahandle.appendTo(itemLi);
          }
          itemLi.appendTo(extIdUl);
        });
        extIdUl.appendTo(li);
      }

      li.appendTo(ul);
    });
    return ul;
  }
});
