import axios from 'axios';
import { CreateClassReturn } from './dtypes';

const makeApiRoute = (path: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}

const createClass = async (password: string): Promise<CreateClassReturn | null> => {
    const res = await axios.post(makeApiRoute('/class/create'), {
        password
    })

    if(res.data.success) {
        return res.data
    } else {
        return null;
    }
}

const reconnectToClass = async (class_id: string, password: string): Promise<CreateClassReturn | null> => {
    const res = await axios.post(makeApiRoute('/class/reconnect'), {
        class_id,
        password
    })

    if(res.data.success) {
        console.log(res.data);
        return res.data
    } else {
        return null;
    }
}
 

export {
    createClass,
    reconnectToClass
}