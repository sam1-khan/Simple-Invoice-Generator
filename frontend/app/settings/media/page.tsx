import { Separator } from "@/components/ui/separator"
import { MediaForm } from "@/app/settings/media/media-form"

export default function SettingsDisplayPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Media</h3>
        <p className="text-sm text-muted-foreground">
          Change the media that will be displayed in your transactions pdf.
        </p>
      </div>
      <Separator />
      <MediaForm />
    </div>
  )
}
