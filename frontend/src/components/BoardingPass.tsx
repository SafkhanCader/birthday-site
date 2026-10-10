import { Heart, Plane } from "lucide-react";
import type { London } from "../api/types";

function Field({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[0.6rem] tracking-[0.25em] text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-lg leading-tight text-ink sm:text-xl">{value}</p>
    </div>
  );
}

/** The London trip, revealed as a first-class ticket for two. */
export function BoardingPass({ trip, passenger }: { trip: London; passenger: string }) {
  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="card-love flex flex-col overflow-hidden sm:flex-row">
        {/* Main stub */}
        <div className="flex-1 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Boarding pass · First class</p>
            <Heart className="size-5 fill-rose text-rose" />
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-5xl font-semibold tracking-wide text-ink sm:text-6xl">{trip.fromCode}</p>
              <p className="text-sm text-muted">{trip.from}</p>
            </div>
            <div className="flex flex-1 items-center gap-2 text-rose">
              <span className="h-px flex-1 border-t border-dashed border-current opacity-50" />
              <Plane className="size-6 animate-float-slow" />
              <span className="h-px flex-1 border-t border-dashed border-current opacity-50" />
            </div>
            <div className="text-right">
              <p className="font-display text-5xl font-semibold tracking-wide text-romance sm:text-6xl">{trip.toCode}</p>
              <p className="text-sm text-muted">{trip.to}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <Field label="Passenger" value={passenger} />
            <Field label="Depart" value={trip.departDate} />
            <Field label="Return" value={trip.returnDate} />
            <Field label="Seat" value="Next to me" />
          </div>
          <Field label="Staying at" value={trip.stay} className="mt-5" />
        </div>

        {/* Perforation — horizontal on phone, vertical on desktop */}
        <div className="relative flex h-6 items-center sm:h-auto sm:flex-col" aria-hidden>
          <span className="absolute -left-3 size-6 rounded-full bg-canvas sm:static sm:-mt-3 sm:mb-auto" />
          <span className="mx-4 h-0 flex-1 border-t-2 border-dashed border-line sm:mx-0 sm:my-2 sm:h-auto sm:w-0 sm:border-t-0 sm:border-l-2" />
          <span className="absolute -right-3 size-6 rounded-full bg-canvas sm:static sm:mt-auto sm:-mb-3" />
        </div>

        {/* Tear-off stub */}
        <div className="flex items-center justify-between gap-6 bg-surface-2 p-6 sm:w-48 sm:flex-col sm:justify-center sm:p-8">
          <div className="text-center">
            <p className="text-[0.6rem] tracking-[0.25em] text-muted uppercase">Gate</p>
            <p className="font-script text-4xl text-rose">Love</p>
          </div>
          {/* Decorative barcode */}
          <div className="flex h-14 items-stretch gap-[3px] sm:h-16" aria-hidden>
            {[3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 3].map((w, i) => (
              <span key={i} className="bg-ink/80" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
