import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Play, Pause, Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

const reviews = [
  {
    id: 1,
    name: "Rahul Sharma",
    designation: "Founder, ABC Enterprises",
    rating: 5,
    review:
      "MA Creation made the entire process extremely smooth. Their professional approach and quick response really helped our business.",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
    youtubeId: "AOdRmBa07N8",
  },
  {
    id: 2,
    name: "Priya Verma",
    designation: "Director, XYZ Solutions",
    rating: 4.5,
    review:
      "The team understood our requirements perfectly and delivered an excellent experience. Highly recommended for professional services.",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80",
    youtubeId: "cU94uH7ctQc",
  },
  {
    id: 3,
    name: "Amit Kumar",
    designation: "Business Owner",
    rating: 5,
    review:
      "Very professional team with great communication. We were impressed with the quality and overall execution of the project.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80",
    youtubeId: "T3bx8QohAkM",
  },
  {
    id: 4,
    name: "Neha Singh",
    designation: "CEO, Digital Ventures",
    rating: 5,
    review:
      "Excellent service and very supportive team. Everything was handled professionally from beginning to end.",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80",
    youtubeId: "YOUR_YOUTUBE_ID_4",
  },
  {
    id: 5,
    name: "Vikas Mehta",
    designation: "Managing Director",
    rating: 4.5,
    review:
      "A reliable team that understands business requirements and delivers with consistency. We had a very positive experience.",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80",
    youtubeId: "YOUR_YOUTUBE_ID_5",
  },
];

function Rating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={17}
          className={
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-white/20"
          }
        />
      ))}

      <span className="ml-2 text-sm font-semibold text-white">
        {rating}/5
      </span>
    </div>
  );
}

function ReviewCard({ review, onPlay }) {
  return (
    <article
      className="
        group relative min-w-[calc(100vw-32px)]
        sm:min-w-[390px]
        lg:min-w-0
        rounded-[28px]
        border border-white/10
        bg-white/[0.045]
        backdrop-blur-xl
        p-5
        shadow-2xl
        transition-all duration-500
        hover:-translate-y-3
        hover:border-white/20
      "
    >
      {/* 3D glow */}
      <div
        className="
          pointer-events-none absolute
          -right-16 -top-16
          h-36 w-36
          rounded-full
          bg-cyan-400/10
          blur-3xl
          transition-all duration-500
          group-hover:bg-cyan-400/20
        "
      />

      {/* Video/Image */}
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={review.image}
          alt={review.name}
          loading="lazy"
          className="
            h-[230px]
            w-full
            object-cover
            transition-transform
            duration-700
            group-hover:scale-105
          "
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Play button */}
        <button
          type="button"
          onClick={() => onPlay(review)}
          className="
            absolute left-1/2 top-1/2
            flex h-16 w-16
            -translate-x-1/2
            -translate-y-1/2
            items-center justify-center
            rounded-full
            border border-white/30
            bg-white/15
            text-white
            backdrop-blur-md
            transition-all duration-300
            hover:scale-110
            hover:bg-white/25
          "
          aria-label={`Play testimonial from ${review.name}`}
        >
          <Play
            size={25}
            fill="currentColor"
            className="ml-1"
          />
        </button>

        {/* Customer name */}
        <div className="absolute bottom-4 left-4 right-4">
          <p className="font-semibold text-white">
            {review.name}
          </p>

          <p className="text-sm text-white/70">
            {review.designation}
          </p>
        </div>
      </div>

      {/* Quote */}
      <div className="relative mt-5">
        <Quote
          size={34}
          className="absolute -left-1 -top-2 text-cyan-400/20"
        />

        <p className="relative pl-5 text-[15px] leading-7 text-white/70">
          {review.review}
        </p>
      </div>

      {/* Rating */}
      <div className="mt-5 flex items-center justify-between">
        <Rating rating={review.rating} />

        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
          Verified Review
        </span>
      </div>
    </article>
  );
}

function YoutubeModal({ review, onClose }) {
  useEffect(() => {
    if (!review) return
    const handleEscape = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [review, onClose])

  if (!review) return null;

  const videoId = review.youtubeId;

  if (!videoId || videoId.startsWith("YOUR_")) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-5 backdrop-blur-md"
        onClick={onClose}
      >
        <div
          className="max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-7 text-center text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-semibold">
            YouTube Video Not Added
          </h3>

          <p className="mt-3 text-sm text-white/60">
            Please add the YouTube video ID for this review.
          </p>

          <button
            onClick={onClose}
            className="mt-5 rounded-xl bg-white px-5 py-2 text-sm font-semibold text-black"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="
        fixed inset-0 z-[9999]
        flex items-center justify-center
        bg-black/85
        p-4
        backdrop-blur-md
      "
      onClick={onClose}
    >
      <div
        className="
          relative
          w-full max-w-5xl
          overflow-hidden
          rounded-2xl
          border border-white/10
          bg-black
          shadow-2xl
        "
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="
            absolute right-3 top-3 z-10
            flex h-10 w-10
            items-center justify-center
            rounded-full
            bg-black/70
            text-white
            backdrop-blur-md
            transition
            hover:bg-black
          "
          aria-label="Close video"
        >
          ×
        </button>

        <div className="aspect-video w-full">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={`${review.name} testimonial`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

export default function CustomerReviewsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  const total = reviews.length;

  useEffect(() => {
    if (isPaused || selectedReview) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, selectedReview, total]);

  const visibleReviews = useMemo(() => {
    return Array.from({ length: 3 }, (_, index) => {
      return reviews[(activeIndex + index) % total];
    });
  }, [activeIndex, total]);

  const next = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const previous = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  return (
    <>
      <section
        id="customer-reviews"
        className="
          relative overflow-hidden
          bg-black
          px-4 py-20
          sm:px-6
          lg:px-8
          xl:py-28
        "
      >
        {/* Background 3D elements */}

        <div
          className="
            pointer-events-none absolute
            left-[8%] top-[15%]
            h-40 w-40
            rounded-full
            border border-cyan-400/10
            animate-[spin_18s_linear_infinite]
          "
        />

        <div
          className="
            pointer-events-none absolute
            right-[5%] top-[35%]
            h-56 w-56
            rounded-full
            border border-purple-400/10
            animate-[spin_25s_linear_infinite_reverse]
          "
        />

        <div
          className="
            pointer-events-none absolute
            left-1/2 top-1/2
            h-72 w-72
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-cyan-500/[0.035]
            blur-3xl
          "
        />

        <div className="relative mx-auto max-w-7xl">
          {/* Heading */}

          <div className="mx-auto max-w-3xl text-center">
            <span
              className="
                inline-flex items-center
                rounded-full
                border border-cyan-400/20
                bg-cyan-400/5
                px-4 py-2
                text-xs font-semibold
                uppercase tracking-[0.2em]
                text-cyan-300
              "
            >
              Customer Stories
            </span>

            <h2
              className="
                mt-5
                text-3xl font-bold
                tracking-tight text-white
                sm:text-4xl
                lg:text-5xl
              "
            >
              What Our{" "}
              <span className="text-cyan-400">
                Customers Say
              </span>
            </h2>

            <p className="mt-5 text-base leading-7 text-white/55 sm:text-lg">
              Real experiences from customers who trusted us
              with their business journey.
            </p>
          </div>

          {/* Cards */}

          <div className="relative mt-12">
            <div className="grid gap-6 lg:grid-cols-3">
              {visibleReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onPlay={setSelectedReview}
                />
              ))}
            </div>

            {/* Controls */}

            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={previous}
                className="
                  flex h-11 w-11
                  items-center justify-center
                  rounded-full
                  border border-white/10
                  bg-white/5
                  text-white
                  transition
                  hover:bg-white/10
                "
                aria-label="Previous reviews"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                className="
                  flex h-11 w-11
                  items-center justify-center
                  rounded-full
                  border border-white/10
                  bg-white/5
                  text-white
                  transition
                  hover:bg-white/10
                "
                aria-label={
                  isPaused
                    ? "Resume reviews"
                    : "Pause reviews"
                }
              >
                {isPaused ? (
                  <Play size={17} fill="currentColor" />
                ) : (
                  <Pause size={17} />
                )}
              </button>

              <button
                type="button"
                onClick={next}
                className="
                  flex h-11 w-11
                  items-center justify-center
                  rounded-full
                  border border-white/10
                  bg-white/5
                  text-white
                  transition
                  hover:bg-white/10
                "
                aria-label="Next reviews"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Progress dots */}

            <div className="mt-5 flex justify-center gap-2">
              {reviews.map((review, index) => (
                <button
                  key={review.id}
                  onClick={() => setActiveIndex(index)}
                  className={`
                    h-1.5 rounded-full transition-all duration-300
                    ${
                      index === activeIndex
                        ? "w-8 bg-cyan-400"
                        : "w-2 bg-white/20"
                    }
                  `}
                  aria-label={`Show review ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* YouTube modal */}

      <YoutubeModal
        review={selectedReview}
        onClose={() => setSelectedReview(null)}
      />
    </>
  );
}