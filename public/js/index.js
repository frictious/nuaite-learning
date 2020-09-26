$(document).ready(function() {
    $('.slider-img').slick({
        infinite: true,
        arrows: false,
        speed: 1000,
        autoplay: true,
        slidein: true,
        cssEase: 'linear'
    });
});

$(document).ready(() => {
    $('.hamburger').on('click', () => {
        $('nav').toggleClass('show');
    });
});

//Height check
