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

//Hamburger button
$(document).ready(() => {
    $('.hamburger').on('click', () => {
        $('nav').toggleClass('show');
    });
});

//Dropdown click
// $(document).ready(() => {
//     $('.dropdown > a').click(() => {
//         $(this).parent().siblings().find('ul').fadeOut(500);
//         $(this).next().stop(true, false, true).fadeToggle(500);
//         return false;
//         //$('nav').toggleClass('show');
//     });
// });

//Height check
