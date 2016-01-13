/**
 * Created by nick on 1/9/16.
 */

(function ($) {
    var time = 0;
    var quality = 25;

    $.fn.imagizer = function (options) {
        var elements = this;

        var settings = {
            "https": false,
            "imagizer_host": "localhost",
            "default_quality": 90,
            "auto_quality": false,
            "test_quality": 75,
            "test_images_amount": 5,
            "average_image_size": 150, // kb
            "use_placeholder": true,
            "detect_device_pixels": true,
            "default_device_pixels": 1,
            placeholder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC"
        };

        function imagizer(images) {
            var start = new Date().getTime();
            var firstSet = images.splice(0, (settings.auto_quality) ? settings.test_images_amount: 1);

            if (settings.use_placeholder) {
                loadPlaceholders(images);
            }

            // load first set of images to get load time
            loadImages(firstSet, function () {

                time = new Date().getTime() - start;
                setQuality();

                // if quality goes up reload first set of images
                if (quality > settings.test_quality) {
                    loadImages(firstSet)
                }

                // load the rest of the images
                loadImages(images)
            });
        }

        function setQuality() {
            if (settings.auto_quality) {
                var topLoadTime = settings.average_image_size * settings.test_images_amount * 7;

                if (time > topLoadTime) {
                    quality = 15;
                } else if (time > topLoadTime * 0.90 ) {
                    quality = 20;
                } else if (time > topLoadTime * 0.80) {
                    quality = 25;
                } else if (time > topLoadTime * 0.70) {
                    quality = 35;
                } else if (time > topLoadTime * 0.60) {
                    quality = 50;
                } else if (time > topLoadTime * 0.50) {
                    quality = 70;
                } else {
                    quality = settings.default_quality;
                }

            } else {
                quality = settings.default_quality;
            }
        }

        function loadPlaceholders(images) {
            $.each(images, function () {
                var self = this;
                var $self = $(self);
                $self.attr("src", settings.placeholder);

                if ($self.attr("src") === undefined || $self.attr("src") === false) {
                    if ($self.is("img")) {
                        $self.attr("src", settings.placeholder);
                    }
                }

                var width = $self.attr("data-width");
                var height = $self.attr("data-height");
                var autocrop = $self.hasClass("autocrop");

                if (width && height && autocrop) {
                    $self.attr("width", width);
                    $self.attr("height", height);

                } else  if (width) {
                    $self.attr("width", width);

                } else if (height) {
                    $self.attr("height", height);
                }
            });
        }

        function loadImages(images, callback) {
            var deferredArray = [];
            var called = false;

            $.each(images, function () {
                var width = $(this).attr("data-width");
                var height = $(this).attr("data-height");
                var uri = $(this).attr("data-src");

                var deferred = new $.Deferred();

                loadImage($(this), width, height, $(this).hasClass("autocrop"), $(this).hasClass("x2"), uri, function () {
                    deferred.resolve();
                });

                deferredArray.push(deferred);
            });

            $.when.apply(this, deferredArray).done(function () {
                if (!called) {
                    called = true;
                    typeof callback === 'function' && callback();
                }
            });

            // call callback if takes longer than 10 secs
            setTimeout(function () {
                if (!called) {
                    called = true;
                    typeof callback === 'function' && callback();
                }
            }, 10000);
        }

        function loadImage(image, width, height, autocrop, retina, uri, callback) {
            var params;

            if (width && height) {
                params = "/" + width + "x" + height;

            } else if (width) {
                params = "/" + width + "x";

            } else if (height) {
                params = "/" + "x" + height;
            }

            if (quality) {
                params += "q" + quality;
            }

            if (autocrop) {
                params += "/c"
            }

            if (isRetinaDisplay()) {
                if (!window.devicePixelRatio) {
                    window.devicePixelRatio = 2;
                }

                params += "/x" + window.devicePixelRatio;
            }

            uri = params + uri;

            if (settings.use_placeholder) {
                if (width && height && autocrop) {
                    $(image).attr("width", width);
                    $(image).attr("height", height);

                } else  if (width) {
                    $(image).attr("width", width);

                } else if (height) {
                    $(image).attr("height", height);
                }

            } else {
                if (width) {
                    $(image).attr("width", 0);

                } else if (height) {
                    $(image).attr("height", 0);
                }
            }

            var protocol = (settings.https ? "https://": "http://");
            image.one("load", function () {

                if (isRetinaDisplay() && (this.naturalWidth / window.devicePixelRatio) >= width && (this.naturalHeight / window.devicePixelRatio) >= height) {
                    if (!window.devicePixelRatio) {
                        window.devicePixelRatio = 2;
                    }

                    $(this).css("width", this.naturalWidth / window.devicePixelRatio);
                    $(this).css("height", this.naturalHeight / window.devicePixelRatio);

                } else if (width) {
                    $(this).css("width", width);

                } else if (height) {
                    $(this).css("height", height);
                }

                image.fadeIn();

                callback();

            }).attr("src", protocol + settings.imagizer_host + uri);
        }

        function isRetinaDisplay() {
            if (window.matchMedia) {
                var mq = window.matchMedia("only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen  and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 1.3dppx)");
                return (mq && mq.matches || (window.devicePixelRatio > 1));
            }
        }

        // load user options
        if (options) {
            $.extend(settings, options);
        }

        // run imagizer
        imagizer(elements);
    }

})(jQuery);
