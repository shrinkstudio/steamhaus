// -----------------------------------------
// SOCIAL SHARE
// [data-social-share] wrapper with [data-social-share-link="platform"] buttons
// Reads: [data-social-share-url], [data-social-share-content],
//        [data-social-share-hashtags], [data-social-share-via],
//        [data-social-share-image], [data-social-share-description]
// -----------------------------------------

let listeners = [];

var platformUrls = {
  facebook: function (p) {
    return buildUrl('https://www.facebook.com/sharer/sharer.php', {
      u: p.url,
      quote: p.content,
      hashtag: p.hashtags
    });
  },
  x: function (p) {
    return buildUrl('https://x.com/intent/post/', {
      url: p.url,
      text: p.content,
      hashtags: p.hashtags,
      via: p.via
    });
  },
  linkedin: function (p) {
    return buildUrl('https://www.linkedin.com/sharing/share-offsite', {
      url: p.url
    });
  },
  reddit: function (p) {
    return buildUrl('https://www.reddit.com/submit', {
      url: p.url,
      title: p.content
    });
  },
  telegram: function (p) {
    return buildUrl('https://t.me/share', {
      url: p.url,
      text: p.content
    });
  },
  pinterest: function (p) {
    return buildUrl('https://www.pinterest.com/pin/create/button/', {
      url: p.url,
      description: p.description || p.content,
      media: p.image
    });
  },
  email: function (p) {
    var subject = encodeURIComponent(p.content || document.title);
    var body = encodeURIComponent(p.url || '');
    return 'mailto:?subject=' + subject + '&body=' + body;
  },
  copy: function (p) {
    return p.url || window.location.href;
  }
};

function buildUrl(base, params) {
  var url = new URL(base);
  Object.keys(params).forEach(function (key) {
    if (params[key]) url.searchParams.append(key, params[key]);
  });
  return url.toString();
}

function openPopup(url, width, height) {
  var left = (screen.width - width) / 2;
  var top = (screen.height - height) / 2;
  window.open(url, '_blank', 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',toolbar=no,menubar=no');
}

export function initSocialShare(scope) {
  scope = scope || document;

  scope.querySelectorAll('[data-social-share]').forEach(function (wrapper) {
    var urlEl = wrapper.querySelector('[data-social-share-url]');
    var contentEl = wrapper.querySelector('[data-social-share-content]');
    var hashtagsEl = wrapper.querySelector('[data-social-share-hashtags]');
    var viaEl = wrapper.querySelector('[data-social-share-via]');
    var imageEl = wrapper.querySelector('[data-social-share-image]');
    var descEl = wrapper.querySelector('[data-social-share-description]');

    var params = {
      url: (urlEl && urlEl.textContent.trim()) || window.location.href,
      content: contentEl ? contentEl.textContent.trim() : '',
      hashtags: hashtagsEl ? hashtagsEl.textContent.trim() : '',
      via: viaEl ? viaEl.textContent.trim() : '',
      image: imageEl ? (imageEl.getAttribute('src') || imageEl.textContent.trim()) : '',
      description: descEl ? descEl.textContent.trim() : ''
    };

    wrapper.querySelectorAll('[data-social-share-link]').forEach(function (btn) {
      var platform = btn.getAttribute('data-social-share-link');
      var buildFn = platformUrls[platform];
      if (!buildFn) return;

      var width = parseInt(btn.getAttribute('data-social-share-width')) || 600;
      var height = parseInt(btn.getAttribute('data-social-share-height')) || 480;

      function onClick(e) {
        e.preventDefault();

        if (platform === 'copy') {
          var copyUrl = buildFn(params);
          if (navigator.clipboard) {
            navigator.clipboard.writeText(copyUrl);
          }
          btn.setAttribute('data-social-share-copied', 'true');
          setTimeout(function () {
            btn.setAttribute('data-social-share-copied', 'false');
          }, 2000);
          return;
        }

        if (platform === 'email') {
          window.location.href = buildFn(params);
          return;
        }

        openPopup(buildFn(params), width, height);
      }

      btn.addEventListener('click', onClick);
      listeners.push({ el: btn, event: 'click', fn: onClick });
    });
  });
}

export function destroySocialShare() {
  listeners.forEach(function (l) { l.el.removeEventListener(l.event, l.fn); });
  listeners = [];
}
