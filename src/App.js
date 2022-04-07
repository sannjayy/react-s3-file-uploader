import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client } from "@aws-sdk/client-s3";
import { S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from './config';
import { useState } from 'react';
import { bytesToSize } from './utils';

function App() {
	const [file, setFile] = useState(null)
	const [percentage, setPercentage] = useState(0)
	const [fileSize, SetFileSize] = useState(null)
	const [uploadedSize, SetUploadedSize] = useState(null)
    const [process, setProcess] = useState(false)
	const [error, setError] = useState(false)
	const [isCompleted, setCompleted] = useState(false)

	const options = {
		region: 'ap-south-1',
		credentials: {
			accessKeyId: AWS_ACCESS_KEY_ID,
			secretAccessKey: AWS_SECRET_ACCESS_KEY
		}
	}

	const uploadFile = async (e) => {
		const file = e.target.files[0];
		if (!file) {
			setFile(null)
			setProcess(false)
			return;
		}
		const target = { Bucket: S3_BUCKET_NAME, Key: file.name, Body: file };

		try {
			setFile(e.target.files[0])

			const parallelUpload = new Upload({
				client: new S3Client(options),
				// queueSize: 4, // optional concurrency configuration
				leavePartsOnError: false, // optional manually handle dropped parts
				params: target,
				s3RetryCount: 3,    // this is the default
    			s3RetryDelay: 1000, // this is the default
			});
            setProcess(true)
			parallelUpload.on("httpUploadProgress", (progress) => {
				// console.log('Uploading Info -> ', progress)
				let percent = Math.floor(progress.loaded / progress.total * 100)				
                
				SetFileSize(bytesToSize(progress.total))
				SetUploadedSize(bytesToSize(progress.loaded))
                setPercentage(percent)
			});


			const response = await parallelUpload.done();
			if (response.$metadata.httpStatusCode === 200) {
				setCompleted(true)
			} else { 
                setFile(null)
			    setProcess(false)
                setError(true) 
            }

		} catch (e) {
			console.log(e);
			setError(true)
            setFile(null)
			setProcess(false)
		}
	}

	return (
		<div className='container'>
			<div className='mt-5'>
				{file ?
					<h5>Uploading: <code>{file.name} ({uploadedSize} / {fileSize})</code></h5>
					:
					<h3>Select a file to upload</h3>
				}
				{!process &&
				<div className="input-group mb-3 mt-3">
					<input type="file" className="form-control" onChange={uploadFile} />
				</div> }
				{process &&
				<div className="progress mt-4">
					<div className="progress-bar" role="progressbar" style={{ width: `${percentage}%` }} aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">{percentage}%</div>
				</div> }
				
				{isCompleted &&
					<div className="alert alert-success mt-4" role="alert">
						<strong>{file.name}</strong> ({fileSize}) has been successfully uploaded.
					</div>
				}
				{error &&
					<div className="alert alert-danger mt-4" role="alert">
						Something wents wrong... 
				  	</div>
				}
			</div>
		</div>
	);
}

export default App;
