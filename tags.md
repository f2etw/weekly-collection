---
layout: page
title: Tags
permalink: /tags/
---

<ul>
  {% assign tags = site.tags | sort %}
  {% for tag in tags %}
  <li class="site-tag">
    <a href="{{ site.baseurl }}/tags/#tag-{{ tag | first | slugify }}"
      style="font-size: {{ tag | last | size  |  times: 4 | plus: 80  }}%">
      {{ tag[0] | replace:'-', ' ' }} ({{ tag | last | size }})
    </a>
  </li>
{% endfor %}
</ul>

{% for tag in site.tags %}
<h3 id="tag-{{ tag[0] }}" class="p-tag">
  <a href="#tag-{{ tag[0] }}" class="anchor">⚓ {{ tag[0] }}</a><a href="#" class="back-to-top"></a>
  <a href="#">back to top</a>
</h3>

<ul>
  {% for post in tag[1] %}
  <li><a href="{{ site.baseurl }}{{ post.url }}" title="{{ post.title }}">{{ post.date | date: "%Y-%m-%d" }} - {{ post.title }}</a></li>
  {% endfor %}
</ul>
{% endfor %}
