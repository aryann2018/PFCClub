"use client";
import TemplatePlanManager, { Template } from "./TemplatePlanManager";

import {
  useGetDietPlanTemplates,
  useGetFoodIngredients,
  useMutateDietPlan,
  useMutateDietPlanTemplate,
} from "../api/hooks";

import { useRouter } from "next/navigation";
import { templates as mocktemplates } from "../api/mocks";
import useDietPlanStore from "./dietplansStore";
import { useEffect } from "react";
import {
  getDietPlanPostPayload,
  getDietPlanTemplateFromDietPlan,
  templateFromDietPlanTemplate,
} from "../api/adapters";
import { useFoodIngridientsStore } from "@/app/common/inputs/SearchableFoodSelect";
import { formatDateToYYYYMMDD } from "@/app/utilities/utils";
import { useQueryCoachProfile } from "../../profile/api/hooks";

interface TemplateScreenProps {
  isNew: boolean;
  planId?: string;
  clientId?: string;
}

export const TemplateScreen = (props: TemplateScreenProps) => {
  const router = useRouter();

  const { activeTemplate, setActiveTemplate, templates, setTemplates } =
    useDietPlanStore();

  const { searchTerm, setFoodIngridients } = useFoodIngridientsStore();

  const {
    data,
    error,
    isLoading,
    refetch: refetchTemplates,
  } = useGetDietPlanTemplates();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (error) {
      return;
    }
    if (!data || !data.data) {
      return;
    }

    const newTemplates = data.data.map((template) =>
      templateFromDietPlanTemplate(template)
    );

    setTemplates(newTemplates);

    if (!activeTemplate?.id) {
      setActiveTemplate(newTemplates[0]?.id);
    } else {
      setActiveTemplate(activeTemplate?.id);
    }
  }, [isLoading, data]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: foodIngridientsData, isLoading: foodIngridientsLoading } =
    useGetFoodIngredients();

  useEffect(() => {
    if (
      !foodIngridientsLoading &&
      foodIngridientsData &&
      foodIngridientsData.data
    ) {
      setFoodIngridients(foodIngridientsData.data);
    }
  }, [foodIngridientsLoading, foodIngridientsData]); // eslint-disable-line react-hooks/exhaustive-deps

  // useEffect(() => {
  //   setActiveTemplate(undefined);
  // }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    data: coachProfileData,
    error: coachProfileError,
    isLoading: coachProfileLoading,
  } = useQueryCoachProfile();

  const { mutate: mutateDietPlan } = useMutateDietPlan({
    onSuccess: (data: any) => {
      console.log("data", data);
    },
    onError: (error: any) => {
      console.log("error", error);
    },
  });

  const { mutate: mutateDietPlanTemplate } = useMutateDietPlanTemplate({
    onSuccess: async (data: any) => {
      await refetchTemplates();
      setActiveTemplate(data.id);
    },
    onError: (error: any) => {
      console.log("error", error);
    },
  });

  const onAssignPress = () => {
    const dietplan = getDietPlanPostPayload(
      activeTemplate!,
      props.clientId!,
      "1",
      true,
      false
    );

    mutateDietPlan({
      ...dietplan,
      client_id: props.clientId!,
      coach_id: coachProfileData!.user_id,
      is_active: true,
      is_paused: false,
      start_date: formatDateToYYYYMMDD(new Date()),
      duration_in_days: 30,
    });
    router.push(`/dashboard/clients/${props.clientId}/`);
  };

  const onCreateDietPlanTemplate = async () => {
    const template = getDietPlanTemplateFromDietPlan(activeTemplate!);
    mutateDietPlanTemplate(template);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <TemplatePlanManager
      isNew={props.isNew}
      clientId={props.clientId!}
      onAssignPress={props.clientId ? onAssignPress : onCreateDietPlanTemplate}
      templates={templates}
    />
  );
};
