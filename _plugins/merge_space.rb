module MergeSpaceFilter

  # Return the url without protocol
  def merge_space(str)
    str.gsub(/\s+/, ' ')
  end

end

Liquid::Template.register_filter(MergeSpaceFilter)
