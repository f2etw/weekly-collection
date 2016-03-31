module StripKUrlProtocolFilter

  # Return the url without protocol
  def strip_url_protocol(url)
    return url.gsub(/^https?:\/\//, '')
  end

end

Liquid::Template.register_filter(StripKUrlProtocolFilter)
