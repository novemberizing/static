AOS.init();

const swiper = new Swiper('.swiper', {
    slidesPerView: 3,
    speed: 1000,
    spaceBetween: 10,
    loopPreventsSliding: true,
    slideToClickedSlide: true,
    autoplay: {
        delay: 2000
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
        dynamicBullets: true
    }
});

const modal = new bootstrap.Modal(document.getElementById('novemberizing-modal'), {});