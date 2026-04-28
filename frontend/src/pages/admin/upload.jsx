import { Link } from "react-router-dom"
import {
    IconUpload,
    IconArrowRight,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default function AdminUpload() {
    return (
        <div className="px-4 lg:px-6">
            <Card>
                <CardHeader>
                    <CardTitle>Upload Jurnal</CardTitle>
                    <CardDescription>
                        Halaman ini sedang dalam pengembangan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                            <IconUpload className="size-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium mb-1">
                            Segera Hadir
                        </p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                            Halaman upload jurnal akan segera tersedia dengan fitur drag-and-drop dan progress indicator.
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/admin">
                            Kembali ke Dashboard
                            <IconArrowRight className="size-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
