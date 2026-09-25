import { getServerSession } from "next-auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/prisma/prisma-client";

const f = createUploadthing();

const auth = async (_req: Request) => {
	const session = await getServerSession(authOptions);
	return session?.user ?? null;
};

export const ourFileRouter = {
	imageUploader: f({
		image: {
			maxFileSize: "4MB",
			maxFileCount: 1,
		},
	})
		.middleware(async ({ req }) => {
			const user = await auth(req);

			if (!user?.id) {
				throw new UploadThingError("Unauthorized");
			}

			return { userId: user.id };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			const userId = metadata.userId;

			await prisma.user.update({
				where: {
					id: userId,
				},
				data: {
					avatar_url: file.ufsUrl,
				},
			});

			return { success: true, avatar_url: file.ufsUrl };
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
