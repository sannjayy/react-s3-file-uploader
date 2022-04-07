import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client, S3 } from "@aws-sdk/client-s3";
import { S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from './config';
import { useState } from 'react';
import { bytesToSize } from './utils';


// function safariStream(blob) {
//     let position = 0;

//     return new ReadableStream({
//       pull: function (controller) {
//         const chunk = blob.slice(position, Math.min(blob.size, position + Math.max(controller.desiredSize, 512*1024)));
//         return chunk.arrayBuffer()
//             .then(function (buffer) {
//               const uint8array = new Uint8Array(buffer);
//               const bytesRead = uint8array.byteLength;

//               position += bytesRead;
//               controller.enqueue(uint8array);

//               if(position >= blob.size)
//                 controller.close();
//             });
//       }
//     });
// }
// function safariStream2(blob) {
//     let position = 0;

//     return new ReadableStream({
//       async pull(controller) {
//         const chunk = blob.slice(
//           position,
//           Math.min(blob.size, position + Math.max(controller.desiredSize, 512 * 1024))
//         );
//         const buffer = await new Response(chunk).arrayBuffer();
//         const uint8array = new Uint8Array(buffer);
//         const bytesRead = uint8array.byteLength;

//         position += bytesRead;
//         controller.enqueue(uint8array);

//         if (position >= blob.size) controller.close();
//       }
//     });
// }
function App() {
	const [file, setFile] = useState(null)
	const [process, setProcess] = useState(null)
	const [fileSize, SetFileSize] = useState(null)
	const [uploadedSize, SetUploadedSize] = useState(null)
	const options = {
		region: 'ap-south-1',
		credentials: {
			accessKeyId: AWS_ACCESS_KEY_ID,
			secretAccessKey: AWS_SECRET_ACCESS_KEY
		}
	}
	const uploadFile = async (e) => {
		const file = e.target.files[0];
		console.log(file);
		if (!file) {
			setFile(null)
			setProcess(null)
			return;
		}
		const target = { Bucket: S3_BUCKET_NAME, Key: file.name, Body: file };

		try {
			setFile(e.target.files[0])

			const parallelUploads3 = new Upload({
				client: new S3Client(options),
				// queueSize: 4, // optional concurrency configuration
				leavePartsOnError: false, // optional manually handle dropped parts
				params: target,
			});

			parallelUploads3.on("httpUploadProgress", (progress) => {
				console.log(progress);
				const percent = Math.floor(progress.loaded / progress.total * 100)
				setProcess(percent)
				SetFileSize(bytesToSize(progress.total))
				SetUploadedSize(bytesToSize(progress.loaded))
				console.log(bytesToSize(progress.total));
			});

			await parallelUploads3.done();
		} catch (e) {
			console.log(e);
		}
	}

	return (
		<div className='container'>
			<div className='mt-5'>
				{/* <input type="file" onChange={uploadFile}/> */}
				{file ?
					<h5>Uploading: <code>{file.name} ({uploadedSize} / {fileSize})</code></h5>
					:
					<h3>Select a file to upload</h3>
				}
				{!process &&
				<div className="input-group mb-3 mt-3">
					<input type="file" className="form-control" onChange={uploadFile} />
					{/* <label class="input-group-text" onChange={handleUpload} >Upload</label> */}
				</div> }

				{process &&
				<div className="progress mt-3">
					<div className="progress-bar" role="progressbar" style={{ width: `${process}%` }} aria-valuenow={process} aria-valuemin="0" aria-valuemax="100">{process}%</div>
				</div> }
			</div>
		</div>
	);
}

export default App;
